# MindEase Architecture Analysis

## Current Architecture Overview

### Backend (Spring Boot 3.5.5 + Java 17)

#### Core Dependencies

- **Framework**: Spring Boot with Spring Data JPA, Spring Security, Spring WebSocket
- **Database**: PostgreSQL with Flyway migrations
- **Auth**: Firebase Auth + JWT tokens (io.jsonwebtoken)
- **AI**: OpenAI GPT (theokanning.openai-gpt3-java v0.18.2)
- **Other**: Stripe SDK, Spring Mail, Spring Cache (Caffeine), Spring AOP

#### Database Schema (Current)

**users**

- id (UUID, PK)
- email (unique, NOT NULL)
- password_hash
- role (enum: USER, ADMIN)
- anonymous_mode (boolean, default false)
- firebase_uid
- quiet_hours_start, quiet_hours_end
- deleted_at, banned, banned_at, banned_by
- created_at, updated_at

**chat_sessions**

- id (UUID, PK)
- user_id (FK → users)
- title (varchar 255)
- created_at, updated_at

**messages**

- id (UUID, PK)
- chat_session_id (FK → chat_sessions)
- content (TEXT)
- is_user_message (boolean)
- is_crisis_flagged (boolean, default false)
- created_at

**mood_entries**

- id (UUID, PK)
- user_id (FK → users)
- mood_value (integer, 1-10)
- notes (TEXT)
- created_at

**Other tables**: journal_entries, mindfulness_sessions, notifications, subscriptions, audit_logs, crisis_flags, user_activity, stripe_events, admin_settings, feature_flags

#### Key Services

- **ChatBotService** (interface) → OpenAIChatBotService (main impl)
  - `generateResponse(message, userId, history)` returns ChatResponse
  - `isCrisisMessage(message)` checks crisis keywords
  - Current persona: compassionate mental health companion, NOT a therapist
  - Crisis detection: simple keyword-based (configurable)
- **CrisisFlaggingService**: handles flagging and logging crisis events
- **OptimizedChatService**: manages chat sessions and messages
- **AutoMoodService**: automatic mood tracking based on chat
- **NotificationService**: push notifications via Firebase
- **SubscriptionService**: Stripe integration for premium features
- **PremiumAccessService**: feature gating via @RequiresPremium

#### Filters & Security

- **JwtAuthenticationFilter**: validates JWT tokens
- **AuthRateLimitingFilter**: rate-limits auth endpoints
- **SecurityConfig**: Spring Security with JWT + Firebase Auth
- **MethodSecurityConfig**: method-level security (@PreAuthorize)

### Frontend (React 19 + Vite)

#### Current Stack (apps/webapp)

- **Framework**: React 19.1.1 + React Router 7.8.2
- **State**: AuthContext (React Context API)
- **i18n**: react-i18next (English/Nepali)
- **UI**: Custom CSS (48 CSS files in styles/)
- **Charts**: Chart.js + react-chartjs-2
- **Animations**: lottie-react
- **Firebase**: firebase 12.2.1 (Auth)
- **WebSocket**: @stomp/stompjs + sockjs-client
- **Payments**: @stripe/stripe-js
- **Notifications**: react-toastify
- **PWA**: vite-plugin-pwa

#### Current Pages

- **User**: Login, Register, CheckIn (home), Chat, Insights, Mindfulness, Settings, Notifications, Subscription, Profile
- **Admin**: Dashboard, UserManagement, CrisisMonitoring, ContentLibrary, Analytics, SystemMonitoring, AuditLogs, CrisisFlags, AdminSettings

#### Layout Structure

- UserLayout: wraps user-facing pages with navbar/footer
- AdminLayout: wraps admin pages with sidebar navigation

### Auth Flow

1. User logs in via email/password or Google OAuth (Firebase)
2. Backend validates Firebase token → issues JWT
3. Frontend stores JWT in localStorage
4. JWT sent in Authorization header for all API calls
5. Anonymous mode: flag on user record, email nullable

### Chat Flow

1. User sends message via WebSocket (/chat endpoint)
2. Backend → OptimizedChatService → ChatBotService (OpenAI)
3. OpenAIChatBotService:
   - Builds conversation context (bounded history, max 20 msgs)
   - Adds system prompts (persona + behavior tags)
   - Calls OpenAI GPT API
   - Checks for crisis keywords
   - Returns ChatResponse(content, isCrisis, source)
4. Message + response saved to messages table
5. If crisis detected → CrisisFlaggingService flags it
6. Response sent back to frontend via WebSocket

### Current Safety Features

- Crisis keyword detection (basic, configurable list)
- Crisis flag logging (crisis_flags table)
- Admin crisis monitoring dashboard
- is_crisis_flagged column on messages

### Current i18n

- **Backend**: Language preference NOT currently passed in requests
- **Frontend**: i18next with English/Nepali locales, language toggle exists

## Gaps & Requirements for New Features

### 1. Safety Enhancements Needed

- **Risk levels**: Need enum (NONE, LOW, MEDIUM, HIGH, CRITICAL)
- **Moderation**: Need moderation_flag, moderation_reason on messages
- **Crisis resources**: Need localized resource content (table or config)
- **Output guardrails**: Need post-processing of AI responses
- **Enhanced classification**: Current keyword-based too simple

### 2. Mood Tracking Enhancements Needed

- **mood_checkins table**: New table separate from mood_entries
  - session_id FK
  - pre/post chat flags
  - tags (array/JSON)
- **session_summaries table**: AI-generated summaries per session
  - summary text
  - key_takeaways (array/JSON)
  - created asynchronously after session ends

### 3. Guided Programs Needed

- **guided_programs table**: program definitions (JSON/rows)
- **guided_sessions table**: user progress through programs
  - user_id, program_id
  - current_step_id
  - responses (JSON)
  - status (in_progress, completed, abandoned)
- **guided_steps table**: individual steps within programs
  - program_id, step_id, next_step_id
  - prompt_text
  - input_type (text, choice, scale, etc.)

### 4. Frontend UI Gaps

- **No Tailwind CSS**: Currently using custom CSS
- **No component library**: Need shadcn/ui or similar
- **No animation library**: Only lottie-react, need Framer Motion
- **Plain UI**: Needs modern redesign with gradients, shadows, animations
- **No dedicated insights views**: Mood trends exist but basic

## Recommended Implementation Order

### Phase 1: Backend Foundation (Weeks 1-2)

1. Create new DB tables (mood_checkins, session_summaries, guided_programs, guided_sessions, guided_steps)
2. Add risk_level, moderation fields to messages
3. Create RiskLevel enum and CrisisResource model
4. Build SafetyClassificationService
5. Build GuardrailService
6. Build MoodCheckInService
7. Build SessionSummaryService
8. Build GuidedProgramService

### Phase 2: Backend API Integration (Week 3)

1. Integrate SafetyClassificationService into chat pipeline
2. Add guardrails to AI response processing
3. Create REST endpoints for mood check-ins
4. Create REST endpoints for session summaries
5. Create REST endpoints for guided programs
6. Add language preference handling to all services

### Phase 3: Frontend Modernization (Weeks 4-5)

1. Add Tailwind CSS + PostCSS config
2. Add shadcn/ui components
3. Add Framer Motion
4. Create design system (colors, spacing, typography)
5. Migrate existing components to Tailwind
6. Redesign UserLayout and navigation

### Phase 4: New Frontend Features (Weeks 6-7)

1. Rebuild chat UI with safety banners
2. Add mood check-in prompts
3. Create insights/trends view with charts
4. Add guided program entry points
5. Build guided program flow UI
6. Add session summary displays

### Phase 5: i18n & Polish (Week 8)

1. Extend translation keys for all new features
2. Test all flows in English and Nepali
3. Add loading states and animations
4. Error handling and edge cases
5. Performance optimization

### Phase 6: Testing & Deployment

1. Unit tests for new services
2. Integration tests for APIs
3. E2E tests for critical flows
4. Security testing for safety features
5. Deploy behind feature flags
6. Monitor and iterate
