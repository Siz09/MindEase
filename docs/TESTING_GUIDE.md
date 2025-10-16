# MindEase Testing Guide

## 🧪 Comprehensive Testing Documentation

This guide covers all testing procedures for the MindEase application, including automated tests, manual testing procedures, and performance benchmarks.

## 📋 Testing Checklist

### ✅ Backend API Testing

#### Authentication Endpoints

- [ ] `POST /api/auth/register` - User registration
- [ ] `POST /api/auth/login` - User login
- [ ] `GET /api/auth/me` - Get current user
- [ ] JWT token validation
- [ ] Firebase token verification
- [ ] Anonymous user creation

#### Chat Endpoints

- [ ] `POST /api/chat/send` - Send message
- [ ] `GET /api/chat/history` - Get chat history
- [ ] WebSocket connection establishment
- [ ] Real-time message broadcasting
- [ ] Crisis keyword detection
- [ ] AI response generation

#### Mood Tracking Endpoints

- [ ] `POST /api/mood/add` - Add mood entry
- [ ] `GET /api/mood/history` - Get mood history
- [ ] Mood validation (1-10 scale)
- [ ] Automatic mood creation (scheduled task)
- [ ] Mood statistics calculation

#### Health & Monitoring

- [ ] `GET /api/health/status` - Health check
- [ ] `GET /actuator/health` - Detailed metrics
- [ ] Database connectivity
- [ ] Performance metrics

### ✅ Frontend Testing

#### Authentication Flow

- [ ] User registration form
- [ ] User login form
- [ ] Anonymous login
- [ ] JWT token storage
- [ ] Automatic logout on token expiry
- [ ] Protected route access

#### Chat Interface

- [ ] WebSocket connection
- [ ] Message sending/receiving
- [ ] Real-time updates
- [ ] Crisis message highlighting
- [ ] Message history loading
- [ ] Connection status indicator

#### Mood Tracking

- [ ] Mood entry form (1-10 scale)
- [ ] Mood history visualization
- [ ] Chart.js integration
- [ ] Auto-generated mood display
- [ ] Mood statistics

#### Internationalization

- [ ] Language switching (EN/NE)
- [ ] Text translation accuracy
- [ ] Language persistence
- [ ] RTL support (if applicable)

#### Responsive Design

- [ ] Mobile compatibility (320px+)
- [ ] Tablet compatibility (768px+)
- [ ] Desktop compatibility (1024px+)
- [ ] Touch interactions
- [ ] Keyboard navigation

## 🔧 Manual Testing Procedures

### 1. Backend API Testing with Postman

#### Setup

1. Import the Postman collection (if available)
2. Set environment variables:
   ```
   BASE_URL: http://localhost:8080
   JWT_TOKEN: (will be set after login)
   ```

#### Test Sequence

**Step 1: Health Check**

```http
GET {{BASE_URL}}/api/health/status
```

Expected: 200 OK with health status

**Step 2: User Registration**

```http
POST {{BASE_URL}}/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "firebaseToken": "your-firebase-token",
  "anonymousMode": false
}
```

Expected: 200 OK with JWT token

**Step 3: User Login**

```http
POST {{BASE_URL}}/api/auth/login
Content-Type: application/json

{
  "firebaseToken": "your-firebase-token"
}
```

Expected: 200 OK with JWT token
Action: Save JWT token to environment variable

**Step 4: Get Current User**

```http
GET {{BASE_URL}}/api/auth/me
Authorization: Bearer {{JWT_TOKEN}}
```

Expected: 200 OK with user details

**Step 5: Add Mood Entry**

```http
POST {{BASE_URL}}/api/mood/add
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json

{
  "moodValue": 7,
  "notes": "Feeling good today!"
}
```

Expected: 200 OK with mood entry created

**Step 6: Get Mood History**

```http
GET {{BASE_URL}}/api/mood/history?page=0&size=10
Authorization: Bearer {{JWT_TOKEN}}
```

Expected: 200 OK with paginated mood entries

**Step 7: Send Chat Message**

```http
POST {{BASE_URL}}/api/chat/send
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json

{
  "message": "Hello, I need some support today"
}
```

Expected: 200 OK with message processed

**Step 8: Get Chat History**

```http
GET {{BASE_URL}}/api/chat/history?page=0&size=20
Authorization: Bearer {{JWT_TOKEN}}
```

Expected: 200 OK with chat messages

**Step 9: Crisis Detection Test**

```http
POST {{BASE_URL}}/api/chat/send
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json

{
  "message": "I feel hopeless and want to harm myself"
}
```

Expected: 200 OK with crisis flag set to true

### 2. WebSocket Testing

#### Using Browser Console

```javascript
// Connect to WebSocket
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect(
  {
    Authorization: 'Bearer YOUR_JWT_TOKEN',
  },
  function (frame) {
    console.log('Connected: ' + frame);

    // Subscribe to user-specific topic
    stompClient.subscribe('/topic/user/YOUR_USER_ID', function (message) {
      console.log('Received:', JSON.parse(message.body));
    });
  }
);
```

#### Using the Built-in Tester

1. Login to the application
2. Navigate to `/testing`
3. Run the WebSocket compatibility tests
4. Verify all tests pass

### 3. Frontend Manual Testing

#### Cross-Browser Testing

Test on the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### Device Testing

- [ ] iPhone (various sizes)
- [ ] Android phones (various sizes)
- [ ] iPad/tablets
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)

#### Accessibility Testing

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Focus indicators
- [ ] ARIA labels

## ⚡ Performance Testing

### Backend Performance

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
   http://localhost:8080/api/mood/history

# Expected: < 100ms average response time
```

### Database Performance

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM mood_entries
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: < 10ms execution time
```

### Frontend Performance

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500KB gzipped

## 🔍 Automated Testing

### Backend Unit Tests

```bash
cd backend
./mvnw test
```

### Frontend Unit Tests

```bash
npm run -w @mindease/webapp test
```

### Integration Tests

```bash
# Run full integration test suite
npm run test:integration
```

## 🐛 Common Issues & Solutions

### WebSocket Connection Issues

**Problem**: WebSocket fails to connect
**Solution**:

1. Check CORS configuration
2. Verify JWT token is valid
3. Ensure WebSocket endpoint is accessible
4. Check browser console for errors

### Database Connection Issues

**Problem**: Database queries fail
**Solution**:

1. Verify PostgreSQL is running
2. Check connection string
3. Ensure database migrations are applied
4. Check user permissions

### Authentication Issues

**Problem**: JWT token validation fails
**Solution**:

1. Verify Firebase configuration
2. Check JWT secret key
3. Ensure token hasn't expired
4. Validate token format

### Performance Issues

**Problem**: Slow API responses
**Solution**:

1. Check database indexes
2. Enable query logging
3. Monitor memory usage
4. Optimize N+1 queries

## 📊 Test Results Template

### Test Execution Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Development/Staging/Production]

#### Backend API Tests

| Endpoint                | Status | Response Time | Notes                |
| ----------------------- | ------ | ------------- | -------------------- |
| POST /api/auth/register | ✅     | 150ms         | -                    |
| POST /api/auth/login    | ✅     | 120ms         | -                    |
| GET /api/auth/me        | ✅     | 80ms          | -                    |
| POST /api/mood/add      | ✅     | 95ms          | -                    |
| GET /api/mood/history   | ✅     | 110ms         | -                    |
| POST /api/chat/send     | ✅     | 200ms         | AI response included |
| GET /api/chat/history   | ✅     | 85ms          | -                    |

#### WebSocket Tests

| Test                 | Status | Notes                     |
| -------------------- | ------ | ------------------------- |
| Connection           | ✅     | Connected successfully    |
| Authentication       | ✅     | JWT token validated       |
| Message Broadcasting | ✅     | Real-time updates working |
| Reconnection         | ✅     | Auto-reconnect functional |

#### Frontend Tests

| Feature           | Desktop | Mobile | Notes |
| ----------------- | ------- | ------ | ----- |
| Login/Register    | ✅      | ✅     | -     |
| Chat Interface    | ✅      | ✅     | -     |
| Mood Tracking     | ✅      | ✅     | -     |
| Language Switch   | ✅      | ✅     | -     |
| Responsive Design | ✅      | ✅     | -     |

#### Performance Metrics

| Metric            | Target  | Actual    | Status |
| ----------------- | ------- | --------- | ------ |
| API Response Time | < 200ms | 125ms avg | ✅     |
| WebSocket Latency | < 100ms | 45ms avg  | ✅     |
| Page Load Time    | < 3s    | 1.8s      | ✅     |
| Bundle Size       | < 500KB | 420KB     | ✅     |

#### Issues Found

1. [Issue description] - [Severity] - [Status]
2. [Issue description] - [Severity] - [Status]

#### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

---

**Testing completed by**: [Name]
**Date**: [Date]
**Overall Status**: ✅ PASS / ❌ FAIL
