# MindEase Codebase Overview

## Project Overview

### Purpose of the System

MindEase is a comprehensive mental wellness application designed to provide accessible, AI-powered support for individuals seeking mental health assistance. The system combines conversational AI therapy, mood tracking, journaling, and mindfulness exercises to create a holistic mental wellness platform. The application emphasizes privacy, multilingual support, and crisis detection to ensure user safety while maintaining accessibility.

### Target Users

The system serves two primary user groups:

1. **End Users**: Individuals seeking mental wellness support, including:
   - Users requiring emotional support and guidance
   - Individuals tracking their mood and mental health patterns
   - People seeking mindfulness and therapeutic exercises
   - Users preferring anonymous or private interactions

2. **Administrators**: System administrators who monitor:
   - Crisis situations and flagged content
   - User activity and system analytics
   - Content management and feature flags
   - System health and performance metrics

### High-level Description

MindEase operates as a full-stack web application with a monorepo architecture. The system provides real-time AI-powered chat support, comprehensive mood tracking with analytics, CBT-style journaling with AI-generated insights, guided mindfulness sessions, and a subscription-based premium feature model. The application implements robust security measures, crisis detection mechanisms, and supports bilingual operation (English and Nepali) to serve diverse user populations.

## Technology Stack

### Frontend Technologies

**Primary Framework:**

- **React 19.2.0**: Modern UI framework with hooks and context API for state management
- **Vite 7.1.12**: Build tool and development server for fast development experience
- **React Router 7.9.5**: Client-side routing for single-page application navigation

**UI and Styling:**

- **Tailwind CSS 4.1.16**: Utility-first CSS framework for responsive design
- **Radix UI**: Accessible component primitives for complex UI elements
- **Framer Motion 12.23.24**: Animation library for smooth user interactions
- **Lottie React 2.4.1**: Animation rendering for engaging visual feedback

**Data Visualization:**

- **Chart.js 4.5.1**: Charting library for mood trends and analytics
- **React Chart.js 2 5.3.1**: React wrapper for Chart.js integration

**Real-time Communication:**

- **SockJS Client 1.6.1**: WebSocket client library
- **STOMP.js 7.2.1**: Messaging protocol over WebSocket for chat functionality

**Internationalization:**

- **i18next 25.6.0**: Internationalization framework
- **react-i18next 16.2.3**: React bindings for i18next (supports English and Nepali)

**Additional Libraries:**

- **Axios 1.13.1**: HTTP client for API communication
- **Firebase 12.5.0**: Authentication and user management
- **Stripe.js 8.2.0**: Payment processing for subscription management
- **React Toastify 11.0.5**: Notification system for user feedback
- **DOMPurify 3.3.0**: XSS protection for user-generated content

### Backend Technologies

**Core Framework:**

- **Spring Boot 3.5.5**: Java application framework providing dependency injection and auto-configuration
- **Java 17**: Programming language and runtime environment
- **Maven**: Build automation and dependency management

**Data Layer:**

- **Spring Data JPA**: Object-relational mapping and repository abstraction
- **Hibernate**: JPA implementation for database operations
- **PostgreSQL 15+**: Relational database management system
- **Flyway**: Database migration and version control tool

**Security:**

- **Spring Security**: Authentication and authorization framework
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **Firebase Admin SDK 9.2.0**: Server-side Firebase authentication validation
- **Spring AOP**: Aspect-oriented programming for cross-cutting concerns (audit logging, premium access control)

**Web Services:**

- **Spring WebSocket**: Real-time bidirectional communication
- **Spring Web MVC**: RESTful API framework
- **Swagger/OpenAPI 2.2.0**: API documentation and testing interface

**Additional Services:**

- **Spring Mail**: Email notification service
- **Spring Retry**: Retry mechanism for transient failures
- **Spring Cache (Caffeine)**: In-memory caching for performance optimization
- **Stripe Java SDK 29.5.0**: Payment processing integration

### AI / NLP Components

**Primary AI Service:**

- **OpenAI GPT API**: Large language model integration for conversational responses
- **Python AI Service**: Microservice handling OpenAI interactions, journal summaries, and mood insights
- **Safety Classification**: Risk assessment and content moderation for user messages

**AI Features:**

- Conversational therapy chatbot with context-aware responses
- Automatic mood detection from chat interactions
- Journal entry summarization and mood insights
- Crisis keyword detection and risk classification
- Behavioral pattern analysis for mood prediction

### Database and Storage

**Primary Database:**

- **PostgreSQL**: Relational database storing all application data
- **UUID Primary Keys**: Unique identifiers for all entities
- **Foreign Key Constraints**: Referential integrity enforcement
- **Indexes**: Optimized query performance on frequently accessed columns

**Data Storage Strategy:**

- Relational tables for structured data (users, sessions, messages, etc.)
- JSONB columns for flexible data storage (guided program responses, user preferences)
- Timestamp-based audit trails for compliance and debugging

### External Services / APIs

**Authentication:**

- **Firebase Authentication**: User authentication service (email/password, OAuth)
- **Firebase Cloud Messaging (FCM)**: Push notification delivery

**AI Services:**

- **OpenAI API**: GPT model access for conversational AI and content generation

**Payment Processing:**

- **Stripe API**: Subscription management, payment processing, and webhook handling

**Email Services:**

- **SMTP Server**: Email delivery for verification, notifications, and password resets

## Feature Breakdown

### Core Features

**1. AI-Powered Chat Support**

- Real-time WebSocket-based chat interface
- Context-aware conversational responses using OpenAI GPT
- Conversation history management with session persistence
- Crisis keyword detection and automatic flagging
- Multilingual support (English/Nepali) for chat interactions
- Voice input/output capabilities (premium feature)

**2. Mood Tracking System**

- Manual mood entry with 1-10 scale rating
- Automatic mood detection from chat interactions
- Mood history visualization with Chart.js
- Mood trends and analytics dashboard
- Mood check-ins (pre-chat, post-chat, standalone)
- Mood prediction based on historical patterns

**3. CBT Journal**

- Daily journal entry creation with rich text support
- AI-powered entry summaries and insights
- Mood correlation analysis from journal content
- Journal history with search and filtering
- Offline support with queue management

**4. Mindfulness Sessions**

- Guided meditation and breathing exercises
- Audio and animation support for immersive experiences
- Session categorization (breathing, meditation, body scan, etc.)
- Difficulty level progression (beginner, intermediate, advanced)
- Offline caching for previously accessed sessions
- User progress tracking and preferences

**5. Bilingual Support**

- Full application localization (English/Nepali)
- Language preference persistence
- Culturally appropriate crisis resources
- Localized content for mindfulness sessions

**6. Subscription Management**

- Stripe-integrated payment processing
- Monthly and annual subscription tiers
- Premium feature gating with aspect-oriented access control
- Subscription status tracking and webhook handling
- Graceful handling of subscription cancellations

**7. Admin Dashboard**

- Real-time crisis monitoring and flagging
- User management and activity tracking
- System analytics (active users, AI usage, mood correlations)
- Audit log viewing with filtering and pagination
- Content library management
- System health monitoring
- Feature flag management

### Supporting Features

**Notification System:**

- In-app notification center
- Email notifications for important events
- Push notifications via Firebase Cloud Messaging
- Quiet hours configuration to respect user preferences

**User Management:**

- Anonymous mode for privacy-focused users
- Account conversion from anonymous to full accounts
- Email verification workflow
- Password reset functionality
- Account lockout after failed login attempts
- User profile management

**Security Features:**

- JWT-based authentication with refresh tokens
- Rate limiting on authentication endpoints
- Input validation and sanitization
- XSS protection with DOMPurify
- SQL injection prevention via parameterized queries
- CORS configuration for secure cross-origin requests

**Offline Support:**

- Progressive Web App (PWA) capabilities
- Service worker for asset caching
- Offline queue for journal entries
- Cached mindfulness session playback

### What the System Intentionally Does NOT Do

**Therapeutic Limitations:**

- The system explicitly does NOT provide professional therapy or medical diagnosis
- AI responses are designed as supportive companions, not replacement for licensed therapists
- No direct integration with emergency services (crisis resources are provided, but users must contact services themselves)

**Scope Limitations:**

- No social features or community forums
- No integration with wearable devices (planned for future)
- No therapist portal or professional features (planned for future)
- No mobile native applications (web-based only, though PWA-enabled)

## Application Architecture

### High-level Flow

```
User Request Flow:
Frontend (React) → API Gateway (Spring Security) → Controller Layer → Service Layer →
Repository Layer → Database (PostgreSQL)

Real-time Chat Flow:
Frontend (WebSocket Client) → Spring WebSocket → Chat Service → AI Service (Python/OpenAI) →
Response Processing → WebSocket Broadcast → Frontend

Crisis Detection Flow:
User Message → Chat Service → Safety Classification → Crisis Flagging Service →
Admin Dashboard (Real-time Updates) → Crisis Resources Display
```

### Responsibility of Each Layer

**Frontend Layer (React Application):**

- User interface rendering and interaction
- Client-side routing and navigation
- State management via React Context API
- WebSocket connection management for real-time chat
- Form validation and user input handling
- Internationalization and localization
- Progressive Web App capabilities

**API Gateway / Security Layer (Spring Security):**

- Request authentication via JWT token validation
- Authorization checks based on user roles
- Rate limiting and request throttling
- CORS policy enforcement
- Security filter chain execution

**Controller Layer (Spring REST Controllers):**

- HTTP request/response handling
- Request validation and DTO transformation
- Error handling and status code management
- API documentation via Swagger annotations
- WebSocket message routing

**Service Layer (Business Logic):**

- Core business logic implementation
- Transaction management
- Integration with external services (OpenAI, Stripe, Firebase)
- Data transformation and aggregation
- Crisis detection and flagging
- Premium access control via AOP

**Repository Layer (Spring Data JPA):**

- Database query execution
- Entity persistence and retrieval
- Custom query methods
- Transaction boundary management

**Database Layer (PostgreSQL):**

- Data persistence and retrieval
- Referential integrity enforcement
- Index optimization for query performance
- Migration management via Flyway

**External Services:**

- **Python AI Service**: Handles OpenAI API calls, journal summarization, safety classification
- **Python Analytics Service**: Mood analysis and pattern recognition
- **Python ML Service**: Machine learning models for mood prediction and risk assessment
- **Python Background Jobs**: Scheduled tasks (data retention, inactivity detection, auto-mood tracking)
- **Python Reports Service**: Report generation and analytics

## Folder and File Structure

### Root Level Structure

```
mindease/
├── apps/                    # Frontend applications
│   ├── marketing/          # Marketing landing page
│   └── webapp/             # Main user application
├── backend/                 # Java Spring Boot backend
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration and migrations
│   ├── services/           # Python microservices
│   └── docs/               # Backend documentation
├── packages/                # Shared packages
│   └── ui/                 # Shared UI components
├── postman/                 # API testing collections
└── scripts/                 # Build and deployment scripts
```

### Backend Structure (`backend/src/main/java/com/mindease/`)

**Feature-based Package Organization:**

- **`auth/`**: Authentication and user management
  - `controller/`: Auth endpoints (login, register, refresh)
  - `service/`: User service, authentication logic
  - `model/`: User entity, Role enum, authentication DTOs
  - `repository/`: User data access

- **`chat/`**: Chat functionality and AI integration
  - `controller/`: Chat API and WebSocket endpoints
  - `service/`: Chat service, AI provider management, crisis detection
  - `model/`: ChatSession, Message entities, AI provider enums
  - `dto/`: Chat request/response DTOs

- **`mood/`**: Mood tracking and analytics
  - `controller/`: Mood entry endpoints
  - `service/`: Mood service, prediction service, auto-mood service
  - `model/`: MoodEntry, MoodCheckIn entities

- **`journal/`**: CBT journal functionality
  - `controller/`: Journal entry endpoints
  - `service/`: Journal service with AI summarization
  - `model/`: JournalEntry entity

- **`mindfulness/`**: Mindfulness sessions
  - `controller/`: Session listing and retrieval
  - `service/`: Session management and user preferences
  - `model/`: MindfulnessSession, UserMindfulnessPreferences

- **`subscription/`**: Payment and subscription management
  - `controller/`: Stripe integration endpoints
  - `service/`: Subscription service, premium access service
  - `model/`: Subscription, StripeEvent entities

- **`notification/`**: Notification system
  - `controller/`: Notification endpoints
  - `service/`: Notification delivery (email, push)
  - `model/`: Notification entity

- **`crisis/`**: Crisis detection and management
  - `service/`: Crisis flagging, resource management
  - `model/`: CrisisFlag, CrisisResource entities

- **`admin/`**: Administrative features
  - `controller/`: Admin dashboard, user management, analytics
  - `service/`: Admin operations, audit logging
  - `model/`: AuditLog, AdminSettings, FeatureFlag

- **`shared/`**: Cross-cutting concerns
  - `config/`: Spring configuration classes (Security, WebSocket, Cache, etc.)
  - `security/`: JWT filters, authentication providers
  - `exception/`: Global exception handlers
  - `aop/`: Aspect-oriented programming (audit logging, premium access)
  - `filter/`: HTTP filters (rate limiting, CORS)
  - `dto/`: Shared DTOs
  - `util/`: Utility classes

- **`dev/`**: Development-only endpoints (testing, debugging)

### Frontend Structure (`apps/webapp/src/`)

**Component Organization:**

- **`pages/`**: Top-level page components
  - Dashboard, Chat, Insights, Mindfulness, Settings, Profile, etc.

- **`components/`**: Reusable UI components
  - `chat/`: Chat-specific components (message bubbles, input, sidebar)
  - `mindfulness/`: Meditation timers, breathing exercises
  - `settings/`: Settings page components
  - `ui/`: Generic UI components (buttons, cards, modals)
  - Layout components (Navbar, UserLayout, Sidebar)

- **`admin/`**: Admin-specific components and pages
  - `pages/`: Admin dashboard pages
  - `components/`: Admin-specific UI components
  - `hooks/`: Admin-specific React hooks

- **`contexts/`**: React Context providers
  - AuthContext, ThemeContext, AdminAuthContext

- **`hooks/`**: Custom React hooks for reusable logic

- **`lib/`**: Utility libraries
  - `api.js`: Axios configuration and API methods
  - `utils.js`: General utility functions

- **`i18n/`**: Internationalization configuration

- **`locales/`**: Translation files (en/, ne/)

- **`styles/`**: CSS stylesheets (48 CSS files for component styling)

- **`config/`**: Application configuration (feature flags)

### Database Migrations (`backend/src/main/resources/db/migration/`)

- **V1\_\_init.sql**: Initial schema (users, chat_sessions, messages, mood_entries)
- **V2-V41**: Incremental migrations adding features (roles, Firebase UID, journal, mindfulness, subscriptions, crisis flags, safety features, etc.)
- Migrations are versioned and executed automatically via Flyway on application startup

## Routing / API Endpoints

### Frontend Routes

**Public Routes:**

- `/login`: User authentication
- `/register`: User registration
- `/forgot-password`: Password reset initiation

**User Routes (Protected):**

- `/`: Dashboard (mood check-in, quick stats)
- `/chat/:chatId?`: Chat interface with optional session ID
- `/insights`: Mood analytics and trends
- `/mindfulness`: Mindfulness session browser
- `/settings`: User preferences and account settings
- `/notifications`: Notification center
- `/subscription`: Subscription management
- `/subscription/success`: Post-payment success page
- `/subscription/cancel`: Post-payment cancellation page
- `/profile`: User profile management
- `/testing`: WebSocket testing interface (development)

**Admin Routes (Admin-only):**

- `/admin`: Admin dashboard overview
- `/admin/users`: User management
- `/admin/crisis-monitoring`: Real-time crisis monitoring
- `/admin/content`: Content library management
- `/admin/analytics`: System analytics
- `/admin/system`: System health monitoring
- `/admin/audit-logs`: Audit log viewer
- `/admin/crisis-flags`: Crisis flag management
- `/admin/settings`: Admin system settings

### Backend API Endpoints

**Authentication (`/api/auth`):**

- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: User login (returns JWT)
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Revoke refresh tokens
- `GET /api/auth/me`: Get current user information
- `POST /api/auth/convert-anonymous`: Convert anonymous account to full account
- `POST /api/auth/send-verification`: Resend email verification
- `GET /api/auth/verify-email`: Verify email with token

**Chat (`/api/chat`):**

- `POST /api/chat/send`: Send chat message (REST fallback)
- `GET /api/chat/history`: Get chat history for user
- `GET /api/chat/sessions`: List all chat sessions
- WebSocket: `/ws` - Real-time chat endpoint

**Mood Tracking (`/api/mood`):**

- `POST /api/mood/add` or `/api/mood/checkin`: Add mood entry
- `GET /api/mood/history`: Get mood history with pagination
- `GET /api/mood/stats`: Get mood statistics and trends
- `GET /api/mood/prediction`: Get mood prediction based on history

**Journal (`/api/journal`):**

- `POST /api/journal/add` or `POST /api/journal`: Create journal entry
- `GET /api/journal/history`: Get journal entries with pagination
- `GET /api/journal/{id}`: Get specific journal entry

**Mindfulness (`/api/mindfulness`):**

- `GET /api/mindfulness/list`: List all available sessions
- `GET /api/mindfulness/{id}`: Get specific session details
- `POST /api/mindfulness/preferences`: Update user preferences

**Subscription (`/api/subscription`):**

- `GET /api/subscription/status`: Get current subscription status
- `POST /api/subscription/create`: Create Stripe checkout session
- `POST /api/subscription/webhook`: Stripe webhook handler
- `POST /api/subscription/cancel`: Cancel subscription

**Notifications (`/api/notifications`):**

- `GET /api/notifications`: Get user notifications
- `PUT /api/notifications/{id}/read`: Mark notification as read
- `DELETE /api/notifications/{id}`: Delete notification

**Admin (`/api/admin`):**

- `GET /api/admin/dashboard`: Dashboard overview data
- `GET /api/admin/users`: User list with filtering
- `GET /api/admin/crisis/flags`: Crisis flags with filtering
- `GET /api/admin/analytics`: System analytics
- `GET /api/admin/audit-logs`: Audit logs with search
- `GET /api/admin/system/status`: System health status

**Health & Monitoring:**

- `GET /api/health/status`: Application health check
- `GET /actuator/health`: Detailed Spring Boot Actuator health metrics

**API Documentation:**

- `GET /swagger-ui.html`: Interactive API documentation
- `GET /api-docs`: OpenAPI specification JSON

## Database Design

### Core Tables

**users**

- Primary key: `id` (UUID)
- Fields: `email` (unique), `password_hash`, `role` (USER/ADMIN), `anonymous_mode`, `firebase_uid`, `quiet_hours_start/end`, `preferred_language`, `region`, `email_verified`, `banned`, `deleted_at`, `created_at`, `updated_at`
- Relationships: Referenced by chat_sessions, mood_entries, journal_entries, subscriptions

**chat_sessions**

- Primary key: `id` (UUID)
- Foreign key: `user_id` → users(id)
- Fields: `title`, `created_at`, `updated_at`
- Relationships: One-to-many with messages

**messages**

- Primary key: `id` (UUID)
- Foreign key: `chat_session_id` → chat_sessions(id)
- Fields: `content` (TEXT), `is_user_message`, `is_crisis_flagged`, `risk_level`, `moderation_action`, `moderation_reason`, `safety_checked`, `created_at`
- Indexes: `chat_session_id`, `created_at` for performance

**mood_entries**

- Primary key: `id` (UUID)
- Foreign key: `user_id` → users(id)
- Fields: `mood_value` (1-10), `notes`, `created_at`
- Indexes: `user_id`, `created_at` for trend queries

**journal_entries**

- Primary key: `id` (UUID)
- Foreign key: `user_id` → users(id)
- Fields: `title`, `content` (TEXT), `ai_summary`, `mood_insight`, `created_at`
- Indexes: `user_id`, `created_at` for history queries

**mindfulness_sessions**

- Primary key: `id` (UUID)
- Fields: `title`, `description`, `type`, `duration`, `media_url`, `category`, `difficulty_level`, `created_at`
- Note: Global content, not user-specific

**subscriptions**

- Primary key: `id` (UUID)
- Foreign key: `user_id` → users(id)
- Fields: `stripe_subscription_id`, `stripe_customer_id`, `status` (active/canceled/trialing), `current_period_start/end`, `billing_period`, `created_at`, `updated_at`
- Indexes: `user_id`, `stripe_subscription_id` for lookups

**crisis_flags**

- Primary key: `id` (UUID)
- Foreign key: `user_id` → users(id), `message_id` → messages(id)
- Fields: `risk_score`, `keywords_detected`, `created_at`
- Unique constraint: `(user_id, message_id)` for idempotency

**audit_logs**

- Primary key: `id` (UUID)
- Foreign key: `user_id` → users(id) (nullable for system actions)
- Fields: `action_type`, `entity_type`, `entity_id`, `details` (JSONB), `ip_address`, `user_agent`, `created_at`
- Indexes: `user_id`, `action_type`, `created_at` for filtering

**notifications**

- Primary key: `id` (UUID)
- Foreign key: `user_id` → users(id)
- Fields: `title`, `message`, `type`, `is_read`, `created_at`
- Indexes: `user_id`, `is_read`, `created_at`

### Key Relationships

- **User → Chat Sessions**: One-to-many (user can have multiple chat sessions)
- **Chat Session → Messages**: One-to-many (session contains multiple messages)
- **User → Mood Entries**: One-to-many (user tracks mood over time)
- **User → Journal Entries**: One-to-many (user creates multiple journal entries)
- **User → Subscription**: One-to-one (user has one active subscription)
- **Message → Crisis Flag**: One-to-one (message may have one crisis flag)

### Database Features

- **UUID Primary Keys**: All tables use UUID for globally unique identifiers
- **Cascade Deletes**: User deletion cascades to related records (chat sessions, mood entries, etc.)
- **Timestamps**: `created_at` and `updated_at` fields for audit trails
- **Check Constraints**: Data validation at database level (e.g., mood_value 1-10)
- **Indexes**: Strategic indexes on foreign keys and frequently queried columns
- **Soft Deletes**: `deleted_at` timestamp for user records (logical deletion)

## Dependencies

### Major Libraries and Their Purpose

**Frontend Dependencies:**

- **React 19.2.0**: Core UI framework enabling component-based architecture
- **React Router 7.9.5**: Client-side routing for single-page application navigation
- **Axios 1.13.1**: HTTP client for RESTful API communication with interceptors for JWT token attachment
- **Firebase 12.5.0**: Authentication service integration (email/password, OAuth)
- **Chart.js 4.5.1**: Data visualization for mood trends and analytics
- **i18next 25.6.0**: Internationalization framework for multilingual support
- **SockJS + STOMP.js**: WebSocket libraries for real-time chat communication
- **Stripe.js 8.2.0**: Payment processing client library for subscription management
- **DOMPurify 3.3.0**: XSS protection library for sanitizing user-generated content

**Backend Dependencies:**

- **Spring Boot 3.5.5**: Application framework providing dependency injection, auto-configuration, and embedded server
- **Spring Security**: Authentication and authorization framework with JWT support
- **Spring Data JPA**: Database abstraction layer reducing boilerplate code
- **Hibernate**: JPA implementation providing object-relational mapping
- **PostgreSQL Driver**: Database connectivity for PostgreSQL
- **Flyway**: Database migration tool ensuring schema version control
- **Firebase Admin SDK**: Server-side Firebase token validation
- **JWT Libraries (jjwt)**: JWT token generation and validation
- **OpenAI Java Client**: Integration with OpenAI GPT API (legacy, now using Python service)
- **Stripe Java SDK**: Server-side payment processing integration
- **Spring WebSocket**: Real-time bidirectional communication support
- **Swagger/OpenAPI**: API documentation generation
- **Spring Mail**: Email notification delivery
- **Caffeine Cache**: High-performance in-memory caching

**Python Service Dependencies:**

- **FastAPI / Uvicorn**: Python web framework for AI service microservices
- **OpenAI Python SDK**: Official OpenAI API client
- **SQLAlchemy**: Python ORM for database access (if needed)
- **Celery**: Distributed task queue for background jobs

## Security & Privacy Considerations

### Authentication Approach

**Multi-layered Authentication:**

1. **Firebase Authentication**: Primary authentication service handling email/password and OAuth providers
2. **JWT Tokens**: Stateless authentication tokens issued by backend after Firebase validation
3. **Refresh Tokens**: Long-lived tokens stored securely for token renewal
4. **Token Expiration**: Short-lived access tokens (configurable, typically 24 hours) with refresh mechanism

**Security Measures:**

- JWT secret validation on startup (minimum 32 characters)
- Token expiration checking (prevents replay attacks)
- Account lockout after 5 failed login attempts (30-minute lockout)
- Rate limiting on authentication endpoints (5 requests per 15 minutes per IP)
- Email verification workflow to prevent fake accounts
- Password reset tokens with 24-hour expiration

### Data Handling Principles

**Privacy-First Design:**

- **Anonymous Mode**: Users can operate without email addresses for maximum privacy
- **Data Minimization**: Only necessary user data is collected and stored
- **Soft Deletes**: User data is logically deleted (deleted_at timestamp) rather than physically removed, allowing for data recovery if needed
- **Quiet Hours**: Users can configure notification quiet hours to respect their privacy

**Data Protection:**

- **Input Sanitization**: All user inputs are sanitized using DOMPurify to prevent XSS attacks
- **Parameterized Queries**: JPA/Hibernate uses parameterized queries preventing SQL injection
- **HTTPS Enforcement**: All API communications should use HTTPS in production
- **CORS Configuration**: Strict CORS policies limiting allowed origins

**Crisis Data Handling:**

- Crisis flags are stored securely with audit trails
- Admin access to crisis data is logged via audit_logs
- Crisis resources are provided but no automatic emergency service contact (user must initiate)

**Compliance Considerations:**

- Audit logging for all administrative actions
- User data retention policies (configurable, implemented in background jobs)
- Email verification for account security
- Account ban functionality with audit trails

### Security Limitations

- No end-to-end encryption for chat messages (messages stored in plaintext in database)
- No two-factor authentication (2FA) implementation
- No IP-based geolocation blocking
- No advanced threat detection beyond basic rate limiting

## Limitations & Future Enhancements

### Current Limitations

**Functional Limitations:**

- No mobile native applications (web-based only, though PWA-enabled)
- No social features or community support forums
- No integration with wearable devices or health apps
- No therapist portal or professional features
- Limited AI model customization (uses OpenAI with fixed parameters)
- No advanced mood prediction algorithms (basic pattern recognition only)

**Technical Limitations:**

- Monolithic backend architecture (not microservices-based, though Python services exist)
- Single database instance (no read replicas or sharding)
- Limited horizontal scaling capabilities
- No CDN integration for static assets
- Basic caching strategy (in-memory only, no distributed cache)

**Security Limitations:**

- No end-to-end encryption for chat messages
- No two-factor authentication
- No advanced fraud detection
- Limited DDoS protection (basic rate limiting only)

### Future Enhancements

**Planned Features (Roadmap):**

- **Mobile Applications**: React Native implementation for iOS and Android
- **Advanced AI Features**: Custom fine-tuned models, improved context management, multi-turn conversation optimization
- **Social Features**: Community support groups, peer connections (with privacy controls)
- **Therapist Portal**: Professional dashboard for licensed therapists to monitor clients
- **Wearable Integration**: Integration with Fitbit, Apple Health, Google Fit for automatic mood correlation
- **Advanced Analytics**: Machine learning-based mood prediction, pattern recognition, personalized recommendations
- **Enhanced Safety**: Multi-level risk assessment, integration with local emergency services, automated check-ins

**Technical Improvements:**

- **Microservices Architecture**: Break down monolithic backend into independent services
- **Distributed Caching**: Redis integration for improved performance
- **CDN Integration**: CloudFlare or AWS CloudFront for static asset delivery
- **Database Optimization**: Read replicas, connection pooling optimization, query performance tuning
- **Monitoring & Observability**: Advanced logging, metrics collection (Prometheus), distributed tracing
- **Load Testing**: Comprehensive performance testing and optimization

**Security Enhancements:**

- **End-to-End Encryption**: Encrypt chat messages at rest and in transit
- **Two-Factor Authentication**: SMS or authenticator app-based 2FA
- **Advanced Threat Detection**: Machine learning-based anomaly detection
- **Security Audits**: Regular penetration testing and security assessments

---

_This document provides a comprehensive overview of the MindEase codebase for academic review purposes. For detailed implementation specifics, refer to the inline code documentation and API specifications available at `/swagger-ui.html`._
