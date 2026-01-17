# MindEase - Mental Wellness Application

## 🌟 Overview

MindEase is a comprehensive mental wellness application that provides AI-powered chat support, mood tracking, and journaling capabilities. Built with a modern tech stack, it offers real-time communication, multilingual support, and privacy-focused features.

## 🏗️ Architecture

### Frontend (React + Vite)

- **Marketing Site**: Landing page with i18n support
- **Web Application**: Full-featured mental wellness dashboard
- **Shared UI Components**: Reusable component library

### Backend (Spring Boot)

- **RESTful APIs**: Authentication, mood tracking, chat management
- **WebSocket Support**: Real-time chat functionality
- **AI Integration**: Modular chatbot service with OpenAI integration
- **Database**: PostgreSQL with JPA/Hibernate
- **Feature-based package layout**:
  - `auth` – auth models, services, controller
  - `chat` – chat controller, services, models, AI integration
  - `mood` – mood tracking & analytics
  - `journal`, `mindfulness`, `subscription`, `notification`, `crisis`
  - `admin` – admin dashboard, management, crisis tooling
  - `dev` – development/test-only helpers
  - `shared` – cross-cutting config, security, DTOs, utilities

## 🚀 Features

### 🧠 Therapeutic Tools

MindEase includes two powerful wellbeing modules:

- **CBT Journal**
  - Write daily reflections.
  - AI-powered summaries generated via OpenAI.
  - History stored per user.
  - Offline-aware (entries queued or disabled when offline).

- **Mindfulness Sessions**
  - Guided exercises with audio and animations.
  - Content loaded dynamically from backend.
  - Works offline for previously cached sessions.

### 🛠️ Backend API Usage

#### 🧠 CBT Journal APIs

**POST /api/journal/add**
_Adds new journal entry with AI summary._

Request Body:

```json
{ "content": "Feeling stressed about exams." }
```

Response:

```json
{
  "id": "uuid",
  "content": "Feeling stressed about exams.",
  "ai_summary": "You are experiencing exam stress and need relaxation.",
  "created_at": "2025-10-07T09:15:00"
}
```

**GET /api/journal/history**
Returns all entries for logged-in user.

#### 🌿 Mindfulness APIs

**GET /api/mindfulness/list**
→ List all sessions

**GET /api/mindfulness/{id}**
→ Fetch audio/animation URL

### 💻 Frontend Usage

- Navigate to `/journal` to write and view entries.
- Navigate to `/mindfulness` to explore guided sessions.
- Offline Banner appears if connection drops; AI summaries disabled.
- JWT Auth handled automatically by `api.js` interceptor.

### 🌐 Offline Caching Strategy

MindEase uses **Workbox** for PWA caching:

| Type                       | Cache Policy           | Details                     |
| -------------------------- | ---------------------- | --------------------------- |
| **Static Assets**          | Stale-While-Revalidate | CSS, JS, Images             |
| **Mindfulness Animations** | Cache First            | Stored for offline playback |
| **Journal History**        | Network First          | Uses cache when offline     |
| **AI Summaries**           | Disabled Offline       | OfflineBanner informs user  |

To test offline:

1. Load the app online first.
2. Open DevTools → Network → Offline.
3. Reload page and verify cached data loads.

### ✅ Completed Features

#### Foundation & Authentication

- [x] Monorepo setup with workspaces
- [x] Firebase Authentication integration
- [x] JWT token management
- [x] User registration and login
- [x] Anonymous mode support
- [x] Responsive navigation

#### Core Infrastructure

- [x] PostgreSQL database setup
- [x] User management system
- [x] Security configuration
- [x] CORS setup for cross-origin requests
- [x] Development environment configuration

#### Chat & Mood Core Features

- [x] Real-time WebSocket chat
- [x] AI-powered responses (OpenAI integration)
- [x] Crisis keyword detection
- [x] Mood tracking with visualization
- [x] Automatic mood entries
- [x] Multilingual support (English/Nepali)
- [x] Chart.js integration for mood trends
- [x] Comprehensive testing suite
- [x] API documentation with Swagger/OpenAPI
- [x] Performance optimization
- [x] Cross-browser compatibility testing

#### Therapeutic Tools

- [x] CBT Journal with AI-powered summaries
- [x] Mindfulness sessions with audio and animations
- [x] Offline support with PWA caching
- [x] Journal history and analytics

#### Subscription & Monetization

- [x] Stripe integration for premium subscriptions
- [x] Subscription management (monthly/annual plans)
- [x] Premium feature gating
- [x] Webhook handling for subscription events
- [x] Payment success/cancel flows

#### Notifications & User Experience

- [x] Push notifications via Firebase
- [x] Quiet hours configuration
- [x] User preferences management
- [x] Enhanced UI/UX improvements

#### Admin & Safety

- [x] Admin dashboard with analytics
- [x] Role-based access control (RBAC)
- [x] Audit logging with AOP
- [x] Crisis flagging and monitoring
- [x] Real-time crisis updates (SSE)
- [x] Analytics endpoints (users, AI usage, mood correlation)

## 🛠️ Technology Stack

### Frontend

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **i18next** - Internationalization
- **Chart.js** - Data visualization
- **SockJS + STOMP** - WebSocket client
- **Axios** - HTTP client
- **React Toastify** - Notifications

### Backend

- **Spring Boot 3.5** - Application framework
- **Spring Security** - Authentication & authorization
- **Spring WebSocket** - Real-time communication
- **JPA/Hibernate** - ORM
- **PostgreSQL** - Database
- **Firebase Admin SDK** - Authentication
- **OpenAI API** - AI chat responses
- **Flyway** - Database migrations
- **Swagger/OpenAPI** - API documentation

### DevOps & Tools

- **Docker** - Containerization
- **Maven** - Build management
- **ESLint + Prettier** - Code formatting
- **Husky** - Git hooks
- **GitHub Actions** - CI/CD

## 📁 Project Structure

```
mindease/
├── apps/
│   ├── marketing/          # Marketing landing page
│   └── webapp/             # Main web application
├── backend/                # Spring Boot backend
│   ├── src/                # Source code
│   ├── docs/               # Backend documentation
│   └── services/           # Python microservices
├── packages/
│   └── ui/                 # Shared UI components
├── docs/                   # Project documentation
├── postman/                # API testing collections
└── scripts/                # Build and CI scripts
```

## 📊 API Documentation

The API is fully documented with Swagger/OpenAPI. Access the documentation at:

- **Development**: `http://localhost:8080/swagger-ui.html`
- **API Docs**: `http://localhost:8080/api-docs`

### Key Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

#### Chat

- `POST /api/chat/send` - Send chat message
- `GET /api/chat/history` - Get chat history
- WebSocket: `/ws` - Real-time messaging

#### Mood Tracking

- `POST /api/mood/add` - Add mood entry
- `GET /api/mood/history` - Get mood history

#### Health & Monitoring

- `GET /api/health/status` - Application health check
- `GET /actuator/health` - Detailed health metrics

## 🔧 Development Setup

### Prerequisites

- Node.js 20+
- Java 17+
- PostgreSQL 15+
- Docker (optional)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mindease
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup database**

   ```bash
   cd backend/docker
   docker-compose up -d
   ```

4. **Configure environment**
   - Copy `.env.example` to `.env`
   - Add Firebase configuration
   - Add OpenAI API key (optional)

5. **Start backend**

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

6. **Start frontend**

   ```bash
   # Marketing site
   npm run -w @mindease/marketing dev

   # Web application
   npm run -w @mindease/webapp dev
   ```

### Environment Variables

#### Backend (`backend/src/main/resources/application.yml`)

```yaml
firebase:
  project-id: your-firebase-project-id

jwt:
  secret: your-jwt-secret
  expiration: 86400000

chat:
  openai:
    api-key: your-openai-api-key
```

#### Frontend (`.env`)

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
./mvnw test
```

### Frontend Testing

```bash
# Run all tests
npm test

# Test specific workspace
npm run -w @mindease/webapp test
```

### WebSocket Testing

The application includes a comprehensive WebSocket testing suite accessible at `/testing` route when logged in.

### Manual API Testing

Use the provided Postman collection or Swagger UI for manual API testing.

**Postman Collections:**

- `postman/MindEase_Full_API.postman_collection.json` - Complete API collection
- `postman/mindease_local.postman_environment.json` - Local environment variables
- `postman/Monetization.postman_collection.json` - Stripe subscription endpoints

### QA Checklist

- Walk UI: register/login → mood → journal → chat → subscription → admin.
- Verify DB-backed entities render in UI and via APIs (history lists, counts).
- Validate RBAC: user blocked from `/admin`, admin has access and data loads.
- Confirm crisis flow: sending a crisis phrase creates a flag, visible in admin and via SSE.
- Stripe: create session → webhook updates status → premium-gated API returns 200.

Notes

- Quiet hours expects strings in `HH:mm`, e.g. `{ "quietHoursStart": "22:00", "quietHoursEnd": "07:00" }`.

Postman Quickstart

- Collection: `postman/MindEase_Full_API.postman_collection.json`
- Environment: `postman/mindease_local.postman_environment.json`
- Local tokens: call `POST /api/dev/login-test` using the collection items to set `{{adminToken}}` and `{{userToken}}`.
- Admin endpoints require `hasRole('ADMIN')`; use `admin@mindease.com` seeded in Flyway.

**Monetization (Stripe) — Setup & Runbook**

- Env (backend):
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `STRIPE_PUBLISHABLE_KEY=pk_test_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...`
  - `STRIPE_PRICE_ID_MONTHLY=price_20usd_month`
  - `STRIPE_PRICE_ID_ANNUAL=price_200usd_year`
  - `STRIPE_SUCCESS_URL=http://localhost:5173/subscription/success`
  - `STRIPE_CANCEL_URL=http://localhost:5173/subscription/cancel`

- Return-from-Checkout flow (Day-7 UX):
  - Backend `POST /api/subscription/create` returns `{ sessionId, publishableKey }`.
  - Frontend calls `stripe.redirectToCheckout({ sessionId })` and sets a short polling window.
  - After webhook lands and status becomes `active`, UI flips without reload and shows a toast.

- Stripe Test Runbook:
  - Create test subscription → verify row in DB and status becomes `active`.
  - Cancel in Stripe → webhook flips status to `canceled` → UI shows toast and premium features gate again.
  - Gated API returns 403 when inactive, 200 when active (PremiumGuardAspect + GlobalExceptionHandler).

See `docs/e2e-monetization.md` for the Day‑7 end‑to‑end details (polling + toasts).

## 🚀 Deployment

### Production Build

```bash
# Build all applications
npm run build

# Build specific workspace
npm run -w @mindease/webapp build
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Firebase Integration**: Robust user management
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Comprehensive request validation
- **Crisis Detection**: Automatic flagging of concerning messages
- **Anonymous Mode**: Privacy-focused user option
- **Data Retention**: Configurable data cleanup policies

## 🌍 Internationalization

The application supports multiple languages:

- **English** (default)
- **Nepali** (नेपाली)

Language switching is available in the settings page and persists across sessions.

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Redis-like caching for frequently accessed data
- **Connection Pooling**: Efficient database connections
- **Lazy Loading**: Optimized component loading
- **Code Splitting**: Reduced bundle sizes
- **WebSocket Optimization**: Efficient real-time communication

## 🔍 Monitoring & Health Checks

- **Spring Boot Actuator**: Comprehensive health monitoring
- **Custom Health Indicators**: Database and service health checks
- **Performance Metrics**: Response time and resource usage tracking
- **Error Tracking**: Comprehensive error logging and handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow ESLint and Prettier configurations
- Use conventional commit messages
- Write comprehensive tests for new features
- Update documentation for API changes

## 📚 Additional Documentation

- **[CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md)** - Comprehensive codebase structure and architecture
- **[DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions
- **[TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Testing procedures and guidelines
- **Backend Docs**: See `backend/docs/` for architecture, security, and integration guides

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation at `/swagger-ui.html`
- Review the testing dashboard at `/testing`

## 🎯 Roadmap

### Advanced AI & Analytics

- [ ] Advanced AI conversation context and memory
- [ ] Mood prediction algorithms
- [ ] Personalized insights and recommendations
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] Voice conversation improvements

### Social & Community

- [ ] Social features and community support
- [ ] Peer support groups
- [ ] Therapist portal and professional features
- [ ] Community guidelines and moderation

### Mobile & Scale

- [ ] Mobile application (React Native)
- [ ] Microservices architecture migration
- [ ] Advanced caching strategies (Redis)
- [ ] CDN integration
- [ ] Advanced monitoring and alerting
- [ ] Load testing and optimization
- [ ] Security audit and penetration testing

---

**MindEase** - Empowering mental wellness through technology 🌱
