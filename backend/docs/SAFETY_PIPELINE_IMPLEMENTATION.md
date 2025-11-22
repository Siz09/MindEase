# Safety Pipeline Implementation Summary

## Overview

The safety pipeline has been fully implemented in the MindEase backend to provide comprehensive crisis detection, risk classification, content moderation, and crisis resource provision.

## Components Implemented

### 1. Data Models

#### Enums

- **RiskLevel** (`model/RiskLevel.java`)
  - NONE, LOW, MEDIUM, HIGH, CRITICAL
  - Used to classify user message risk

- **ModerationAction** (`model/ModerationAction.java`)
  - NONE, FLAGGED, MODIFIED, BLOCKED
  - Tracks actions taken on AI responses

#### Entities

- **CrisisResource** (`model/CrisisResource.java`)
  - Stores localized crisis hotlines and support services
  - Indexed by language and region
  - Seeded with US and Nepal resources

- **Message** (extended)
  - Added fields: `risk_level`, `moderation_action`, `moderation_reason`, `safety_checked`
  - Full audit trail of safety checks

- **MoodCheckIn** (`model/MoodCheckIn.java`)
  - 1-5 mood rating with tags
  - Pre-chat, post-chat, or standalone
  - Linked to sessions

- **SessionSummary** (`model/SessionSummary.java`)
  - AI-generated chat summaries
  - Key takeaways and sentiment
  - One per session

- **GuidedProgram, GuidedStep, GuidedSession** (Guided therapy models)
  - Full schema for CBT-style programs
  - Step-by-step flow with JSONB storage for flexibility

- **User** (extended)
  - Added `preferred_language` field

### 2. Database Migration

**File:** `V28__add_safety_and_mood_tracking_features.sql`

**Changes:**

- Altered `messages` table with 4 new safety columns
- Created 7 new tables:
  - crisis_resources
  - mood_checkins
  - session_summaries
  - guided_programs
  - guided_steps
  - guided_sessions
- Altered `users` table for language preference
- Created optimized indexes for all new tables
- Inserted seed crisis resources (US + Nepal, English + Nepali)
- Added CHECK constraints for enum validation

### 3. Repositories

Created JPA repositories with custom query methods:

- **CrisisResourceRepository**
  - `findByLanguageAndRegionOrGlobal()` - Get resources by language + region
  - `findByLanguageAndActiveTrueOrderByDisplayOrder()` - Active resources

- **MoodCheckInRepository**
  - `findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc()` - Recent check-ins
  - `getMoodTrendByDate()` - Aggregated mood trends
  - `getAverageMoodScore()` - Average mood over period

- **SessionSummaryRepository**
  - `findBySessionId()` - Get summary for session
  - `findByUserIdOrderByCreatedAtDesc()` - User's summaries
  - `countBySentimentForUser()` - Sentiment distribution

- **GuidedProgramRepository**, **GuidedStepRepository**, **GuidedSessionRepository**
  - Full CRUD + query methods for guided programs

### 4. Core Services

#### SafetyClassificationService

**Location:** `service/SafetyClassificationService.java`

**Responsibilities:**

- Classify user messages into RiskLevel (NONE → CRITICAL)
- Keyword-based detection with 40+ crisis keywords across 4 risk levels
- Analyze historical message patterns for escalation
- Retrieve crisis resources by language/region
- Generate risk-adjusted AI prompts

**Key Methods:**

- `classifyMessage(content, history)` → RiskLevel
- `getCrisisResources(riskLevel, language, region)` → List<CrisisResource>
- `getSafetyPrompt(riskLevel)` → String (system prompt adjustment)

**Features:**

- Conservative classification (prefers false positives)
- Context-aware (analyzes recent message history)
- Cached crisis resources (performance)
- Localized support (English/Nepali initially)

#### GuardrailService

**Location:** `service/GuardrailService.java`

**Responsibilities:**

- Check AI-generated responses for unsafe content
- Detect prohibited content (e.g., "you should kill yourself")
- Detect sensitive content that needs context
- Detect inappropriate diagnosis attempts
- Detect dismissive responses to high-risk users
- Modify or block problematic responses

**Key Methods:**

- `checkResponse(response, userRiskLevel)` → GuardrailResult
  - Returns: ModerationAction, reason, finalResponse

**Features:**

- Prohibited content → BLOCKED + safe fallback
- Sensitive content + high risk → MODIFIED
- Diagnosis attempts → FLAGGED
- Dismissive responses → MODIFIED with empathy

**Safety Fallback:**
Standard safe response used when content is blocked

#### SafeAIChatService

**Location:** `service/SafeAIChatService.java`

**Responsibilities:**

- Orchestrate the complete safety pipeline
- Wrap existing ChatBotService with safety checks
- Integrate classification, guardrails, and crisis resources

**Flow:**

1. Classify user message (SafetyClassificationService)
2. Generate AI response (delegate to OpenAIChatBotService)
3. Apply guardrails (GuardrailService)
4. Attach crisis resources if HIGH/CRITICAL
5. Add moderation warnings if modified
6. Return enhanced ChatResponse with full safety metadata

**Enhanced ChatResponse fields:**

- `riskLevel` - User message classification
- `crisisResources` - List of crisis hotlines/services
- `moderationAction` - What was done to AI response
- `moderationWarning` - User-facing safety message

#### OptimizedChatService (Extended)

**Location:** `service/OptimizedChatService.java`

**New Method:**

- `saveMessageWithSafety()` - Save message with full safety metadata
  - Stores risk_level, moderation_action, moderation_reason
  - Sets safety_checked = true
  - Updates crisis flag based on risk level

### 5. Integration Points

**Current Integration Status:**

- ✅ Models and enums created
- ✅ Database migration ready
- ✅ Repositories implemented
- ✅ Core safety services implemented
- ✅ Enhanced ChatResponse DTO
- ⏳ **Pending**: Update chat controllers to use SafeAIChatService
- ⏳ **Pending**: Update WebSocket handler to use new save method
- ⏳ **Pending**: Frontend integration for crisis resource display

**Next Steps for Complete Integration:**

1. **Update ChatApiController / ChatHandler:**

   ```java
   @Autowired
   @Qualifier("safeAIChatService")
   private ChatBotService chatService;

   // When processing message:
   ChatResponse response = chatService.generateResponse(userMessage, userId, history);

   // Save with safety metadata:
   chatService.saveMessageWithSafety(
       session, response.getContent(), false,
       response.getRiskLevel(), response.getModerationAction(), ...
   );
   ```

2. **Add language preference handling:**
   - Pass user.getPreferredLanguage() to SafeAIChatService
   - Update getUserRegion() logic (from IP or user profile)

3. **Frontend updates:**
   - Display crisis resources when present in response
   - Show moderation warnings
   - Add safety disclaimer banners

## Testing Strategy

### Unit Tests Needed

- RiskLevel classification accuracy
- Guardrail detection patterns
- Historical pattern analysis
- Crisis resource retrieval

### Integration Tests Needed

- Complete safety pipeline flow
- Message persistence with safety metadata
- Crisis flag creation
- Fallback behavior on errors

### E2E Tests Needed

- High-risk message → crisis resources displayed
- Inappropriate AI response → blocked/modified
- Multi-turn escalation detection

## Configuration

### Application Properties

```yaml
chat:
  crisis-detection:
    enabled: true # Enable/disable safety checks
```

### Feature Flags

Consider adding feature flag for gradual rollout:

- `safety.classification.enabled`
- `safety.guardrails.enabled`
- `safety.crisis-resources.enabled`

## Performance Considerations

1. **Caching:**
   - Crisis resources cached in-memory (rarely change)
   - Consider caching risk classification for identical messages

2. **Async Processing:**
   - Safety checks are synchronous (necessary for chat flow)
   - Consider async audit logging for performance

3. **Database Indexes:**
   - All foreign keys indexed
   - Composite indexes for common queries
   - JSONB GIN indexes if querying within JSON fields

## Security & Privacy

1. **PII Protection:**
   - Crisis flags contain sensitive data
   - Admin-only access via @PreAuthorize
   - Audit all crisis flag views

2. **Data Retention:**
   - Safety metadata kept for audit purposes
   - Consider retention policy for old risk classifications

3. **Logging:**
   - Log safety events at appropriate levels
   - Redact user content in logs
   - HIGH/CRITICAL classifications logged as warnings

## Monitoring & Alerts

### Recommended Metrics

- Count of messages by RiskLevel (daily)
- % of AI responses moderated
- Crisis resource click-through rate (frontend)
- Average time for safety checks

### Alerts

- CRITICAL risk detections (immediate)
- Spike in HIGH risk classifications
- Guardrail BLOCKED actions (review queue)

## Future Enhancements

1. **ML-based Classification:**
   - Replace keyword matching with fine-tuned transformer model
   - Train on mental health crisis conversations
   - Continuous learning from flagged messages

2. **Contextual Guardrails:**
   - LLM-based content safety check
   - Understand nuance and context better

3. **Resource Expansion:**
   - More regions and languages
   - Video/chat crisis support
   - Peer support communities

4. **Analytics Dashboard:**
   - Admin view of risk trends
   - Effectiveness metrics
   - False positive review

## Documentation for Frontend Team

### API Response Format

```json
{
  "content": "I hear that you're struggling...",
  "isCrisisFlagged": true,
  "riskLevel": "HIGH",
  "crisisResources": [
    {
      "title": "National Suicide Prevention Lifeline",
      "contactInfo": "988",
      "availability": "24/7",
      "description": "Free and confidential support..."
    }
  ],
  "moderationWarning": "If you're in crisis, please reach out...",
  "moderationAction": "NONE",
  "timestamp": "2025-11-21T10:30:00",
  "provider": "openai:mindease"
}
```

### UI Recommendations

- Show crisis resources as prominent cards/buttons
- Use calm colors (avoid alarming red)
- Make contact info one-click (tel: links, etc.)
- Add "I'm safe now" / "I got help" feedback buttons
- Show moderation warnings gently, not accusatorily

## Compliance & Legal

- Safety pipeline is a tool, not a substitute for professional help
- Clear disclaimers that MindEase is not a crisis service
- Terms of Service should address crisis situations
- Consider liability insurance for crisis handling
- Regular review of crisis resources for accuracy

## Conclusion

The safety pipeline is fully implemented and ready for integration. The next critical step is updating the chat controllers to use `SafeAIChatService` and implementing the frontend crisis resource display.

This implementation provides a strong foundation for ethical mental health AI, prioritizing user safety while maintaining a supportive, non-judgmental experience.
