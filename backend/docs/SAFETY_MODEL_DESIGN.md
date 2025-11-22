# Safety, Mood Tracking, and Guided Programs - Data Model Design

## Overview

This document describes the data model extensions for MindEase's high-impact features:

1. Safety classification and crisis intervention
2. Mood tracking and session summaries
3. Guided therapeutic programs

## Database Schema

### Safety & Crisis Management

#### Enums

**RiskLevel** (Java enum mapped to VARCHAR in DB)

- `NONE` - No risk detected, normal conversation
- `LOW` - Mild distress, negative mood, no immediate concerns
- `MEDIUM` - Moderate distress, mentions of self-harm thoughts without intent
- `HIGH` - Strong distress, suicidal ideation, self-harm intent
- `CRITICAL` - Immediate danger, active crisis, requires urgent intervention

**ModerationAction** (Java enum mapped to VARCHAR in DB)

- `NONE` - No moderation needed, content passed all checks
- `FLAGGED` - Content flagged but allowed through with warning
- `MODIFIED` - Content partially modified to remove unsafe elements
- `BLOCKED` - Content blocked entirely and replaced with safe fallback

#### Extended Messages Table

New columns added to `messages`:

- `risk_level` (VARCHAR(20), NOT NULL, DEFAULT 'NONE') - Classification result
- `moderation_action` (VARCHAR(20), DEFAULT 'NONE') - Action taken on AI response
- `moderation_reason` (TEXT) - Explanation for moderation
- `safety_checked` (BOOLEAN, NOT NULL, DEFAULT FALSE) - Flag indicating safety check completed

#### Crisis Resources Table

`crisis_resources` - Localized crisis support information

- `id` (UUID, PK)
- `language` (VARCHAR(10), NOT NULL) - ISO language code (e.g., 'en', 'ne')
- `region` (VARCHAR(50)) - Region/country code (e.g., 'US', 'NP', 'global')
- `resource_type` (VARCHAR(50), NOT NULL) - 'hotline', 'textline', 'website', 'emergency'
- `title` (VARCHAR(255), NOT NULL) - Display name
- `description` (TEXT) - Detailed description
- `contact_info` (VARCHAR(255), NOT NULL) - Phone, URL, or text number
- `availability` (VARCHAR(100)) - e.g., "24/7", "Mon-Fri 9am-5pm"
- `display_order` (INTEGER, NOT NULL, DEFAULT 0) - UI ordering
- `active` (BOOLEAN, NOT NULL, DEFAULT TRUE) - Enable/disable
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**

- `idx_crisis_resources_language_region` (language, region)
- `idx_crisis_resources_active` (active)

**Default Data:**
Seeded with US (988, Crisis Text Line) and Nepal (TPO Nepal) resources in English and Nepali.

### Mood Tracking

#### Mood Check-ins Table

`mood_checkins` - Structured mood tracking separate from legacy mood_entries

- `id` (UUID, PK)
- `user_id` (UUID, FK → users, NOT NULL)
- `session_id` (UUID, FK → chat_sessions) - Optional link to chat session
- `score` (INTEGER, NOT NULL, CHECK 1-5) - Simplified 1-5 scale
- `tags` (TEXT[]) - Array of mood descriptors: ['anxious', 'calm', 'stressed', etc.]
- `checkin_type` (VARCHAR(20), NOT NULL, DEFAULT 'standalone') - 'pre_chat', 'post_chat', 'standalone'
- `created_at` (TIMESTAMP, NOT NULL)

**Indexes:**

- `idx_mood_checkins_user_id` (user_id)
- `idx_mood_checkins_session_id` (session_id)
- `idx_mood_checkins_created_at` (created_at)
- `idx_mood_checkins_user_created` (user_id, created_at DESC) - For trend queries

**Use Cases:**

- Pre-chat check-in: User rates mood before starting conversation
- Post-chat check-in: User rates mood after conversation to measure impact
- Standalone check-in: Daily mood logging independent of chat

#### Session Summaries Table

`session_summaries` - AI-generated chat session summaries

- `id` (UUID, PK)
- `session_id` (UUID, FK → chat_sessions, NOT NULL, UNIQUE) - One summary per session
- `summary` (TEXT, NOT NULL) - Brief narrative summary (2-3 sentences)
- `key_takeaways` (TEXT[]) - Array of insights/action items
- `sentiment` (VARCHAR(20)) - 'positive', 'neutral', 'negative'
- `generated_by` (VARCHAR(50), NOT NULL, DEFAULT 'ai') - 'ai' or 'manual'
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**

- `idx_session_summaries_session_id` (session_id)

**Generation Strategy:**

- Triggered asynchronously after session ends (inactivity timeout or explicit close)
- Uses GPT with condensed chat history + prompt: "Summarize this conversation in 2-3 sentences. Extract 3 key takeaways."

### Guided Programs

#### Guided Programs Table

`guided_programs` - Program definitions (CBT exercises, breathing, etc.)

- `id` (UUID, PK)
- `name` (VARCHAR(255), NOT NULL) - Display name
- `description` (TEXT, NOT NULL) - Detailed description
- `program_type` (VARCHAR(50), NOT NULL) - 'cbt', 'breathing', 'grounding', 'thought_reframing'
- `language` (VARCHAR(10), NOT NULL, DEFAULT 'en') - Program language
- `estimated_duration_minutes` (INTEGER) - Estimated completion time
- `active` (BOOLEAN, NOT NULL, DEFAULT TRUE) - Enable/disable
- `display_order` (INTEGER, NOT NULL, DEFAULT 0) - UI ordering
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**

- `idx_guided_programs_language` (language)
- `idx_guided_programs_active` (active)

**Example Programs:**

1. **Thought Reframing** (CBT) - 5 mins
   - Identify negative thought
   - Challenge its accuracy
   - Generate alternative thought
2. **4-7-8 Breathing** - 3 mins
   - Guided breathing exercise steps
3. **5-4-3-2-1 Grounding** - 5 mins
   - Sensory grounding technique

#### Guided Steps Table

`guided_steps` - Individual steps within programs

- `id` (UUID, PK)
- `program_id` (UUID, FK → guided_programs, NOT NULL)
- `step_number` (INTEGER, NOT NULL) - Sequential order
- `title` (VARCHAR(255)) - Optional step title
- `prompt_text` (TEXT, NOT NULL) - What to show/ask user
- `input_type` (VARCHAR(50), NOT NULL) - 'text', 'choice', 'scale', 'none'
- `input_options` (JSONB) - For 'choice' type: `{"options": ["Option 1", "Option 2"]}`
- `next_step_logic` (JSONB) - Conditional navigation: `{"default": 2, "if_choice_0": 3}`
- `created_at`, `updated_at` (TIMESTAMP)
- **UNIQUE** constraint on (program_id, step_number)

**Indexes:**

- `idx_guided_steps_program_id` (program_id)

**Input Types:**

- `text` - Free-form text input
- `choice` - Multiple choice selection (radio buttons)
- `scale` - 1-5 or 1-10 rating
- `none` - Display-only step (no input required)

#### Guided Sessions Table

`guided_sessions` - User progress through programs

- `id` (UUID, PK)
- `user_id` (UUID, FK → users, NOT NULL)
- `program_id` (UUID, FK → guided_programs, NOT NULL)
- `current_step_number` (INTEGER, NOT NULL, DEFAULT 1) - Where user is in the flow
- `responses` (JSONB) - Stores responses by step: `{"1": "text response", "2": 3, "3": "choice_0"}`
- `status` (VARCHAR(20), NOT NULL, DEFAULT 'in_progress') - 'in_progress', 'completed', 'abandoned'
- `started_at` (TIMESTAMP, NOT NULL) - Session start
- `completed_at` (TIMESTAMP) - Set when status → 'completed'
- `updated_at` (TIMESTAMP)

**Indexes:**

- `idx_guided_sessions_user_id` (user_id)
- `idx_guided_sessions_program_id` (program_id)
- `idx_guided_sessions_status` (status)
- `idx_guided_sessions_user_started` (user_id, started_at DESC) - For history queries

**State Transitions:**

- `in_progress` → User actively working through steps
- `completed` → User finished all steps
- `abandoned` → User didn't complete (inactivity timeout or user action)

### Extended Users Table

New column:

- `preferred_language` (VARCHAR(10), DEFAULT 'en') - User's language preference for AI responses and content

## Data Flow Examples

### Safety Check Flow

1. User sends message
2. Backend creates `Message` entity with `safety_checked = false`
3. `SafetyClassificationService.classifyMessage(content, history)` returns `RiskLevel`
4. Update message: `risk_level = result`, `safety_checked = true`
5. If `HIGH` or `CRITICAL`:
   - Flag `is_crisis_flagged = true`
   - Create `CrisisFlag` entity (existing table)
   - Fetch `CrisisResource` entries for user's language/region
6. Send AI request with risk-adjusted system prompt
7. `GuardrailService.checkResponse(aiResponse, riskLevel)` returns `ModerationAction`
8. If `MODIFIED` or `BLOCKED`:
   - Update AI response message: `moderation_action`, `moderation_reason`
9. Return to frontend with metadata: `{content, isCrisis, crisisResources[], moderationWarning}`

### Mood Check-in Flow

1. User clicks "How are you feeling?" or ends chat
2. Frontend shows 1-5 scale + optional tags
3. POST `/api/mood/checkins` with `{score, tags, checkinType, sessionId?}`
4. Backend creates `MoodCheckIn` entity
5. Return success

**Trend Query:**

- GET `/api/mood/trends?days=30`
- Query: `SELECT DATE(created_at), AVG(score), COUNT(*) FROM mood_checkins WHERE user_id = ? AND created_at > NOW() - INTERVAL '30 days' GROUP BY DATE(created_at)`

### Session Summary Flow

1. Chat session ends (inactivity timer or user closes)
2. Backend triggers async job: `SessionSummaryService.generateSummary(sessionId)`
3. Fetch all messages for session
4. Call GPT with prompt: "Summarize this conversation briefly. Extract key takeaways."
5. Parse response → create `SessionSummary` entity
6. Frontend polls or receives WebSocket update: "Your session summary is ready"

### Guided Program Flow

1. User browses active programs: GET `/api/guided/programs?language=en`
2. User starts program: POST `/api/guided/sessions` with `{programId}`
3. Backend creates `GuidedSession` with `current_step_number = 1`
4. Frontend fetches step: GET `/api/guided/sessions/{sessionId}/current-step`
5. Backend returns `GuidedStep` for step 1
6. User provides response: POST `/api/guided/sessions/{sessionId}/respond` with `{response}`
7. Backend updates `responses` JSONB, increments `current_step_number`
8. Repeat steps 4-7 until all steps complete
9. Backend sets `status = 'completed'`, `completed_at = NOW()`

## Migration Strategy

**File:** `V28__add_safety_and_mood_tracking_features.sql`

**Changes:**

1. Alter `messages` table - add 4 new columns
2. Create 7 new tables:
   - crisis_resources
   - mood_checkins
   - session_summaries
   - guided_programs
   - guided_steps
   - guided_sessions
3. Alter `users` table - add preferred_language
4. Create indexes for optimal query performance
5. Insert seed data for crisis resources (US + Nepal)
6. Add CHECK constraints for enum validation

**Rollback Safety:**

- All new columns are nullable or have defaults
- New tables don't affect existing functionality
- No data loss on rollback (can drop new tables safely)

## Repository Interfaces

Repositories to create:

- `CrisisResourceRepository` - `findByLanguageAndRegionAndActiveTrue(String, String, Boolean)`
- `MoodCheckInRepository` - `findByUserIdAndCreatedAtAfter(UUID, LocalDateTime)`, aggregation queries
- `SessionSummaryRepository` - `findBySessionId(UUID)`, `existsBySessionId(UUID)`
- `GuidedProgramRepository` - `findByLanguageAndActiveTrue(String, Boolean)`
- `GuidedStepRepository` - `findByProgramIdOrderByStepNumber(UUID)`
- `GuidedSessionRepository` - `findByUserIdAndStatus(UUID, String)`

## Security Considerations

1. **PII Protection**: Mood check-in tags and guided session responses may contain sensitive data
   - Encrypted at rest (PostgreSQL transparent encryption)
   - Logged with redaction in audit logs
2. **Crisis Data Handling**: Crisis flags are high-sensitivity
   - Admin-only access via `@PreAuthorize("hasRole('ADMIN')")`
   - Audit log all views/exports
3. **AI Safety**: Risk classification must be conservative
   - Prefer false positives (flag more) over false negatives
   - Human review queue for CRITICAL classifications
4. **Localization Security**: Crisis resources must be vetted
   - Admin approval workflow before activation
   - Regular review of contact info validity

## Performance Optimization

1. **Indexes**: All foreign keys and common query patterns indexed
2. **JSONB**: Use JSONB for flexible schema (guided program logic) with GIN indexes if querying within
3. **Async Processing**: Session summaries generated out-of-band to not block chat responses
4. **Caching**: Crisis resources cached in-memory (rarely change)
5. **Partitioning**: Consider partitioning mood_checkins by created_at after 100K+ records

## Testing Strategy

1. **Unit Tests**:
   - Enum validation
   - Risk classification logic
   - Moderation rules
   - Step navigation logic
2. **Integration Tests**:
   - Complete safety check flow
   - Mood check-in CRUD + aggregation
   - Guided session state machine
3. **E2E Tests**:
   - Crisis detection → resource display
   - Mood trend chart rendering
   - Complete guided program walkthrough
4. **Load Tests**:
   - Concurrent safety checks (should not slow chat)
   - Mood aggregation query performance

## Future Enhancements

1. **ML-based Risk Classification**: Replace keyword matching with fine-tuned model
2. **Personalized Programs**: Recommend guided programs based on mood trends
3. **Progress Visualization**: User dashboard showing mood improvement over time
4. **Multi-language Programs**: More languages beyond English/Nepali
5. **Therapist Integration**: Export session summaries for therapist review (with consent)
