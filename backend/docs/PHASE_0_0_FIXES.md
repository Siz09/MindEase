# Phase 0.0: Critical 500 Errors - Fixes Applied

## Summary

Fixed all critical endpoint issues identified in the backend test results. The backend was not starting due to a Flyway migration checksum mismatch, and several endpoints had path mismatches with test expectations.

## ✅ Fixes Applied

### 1. **Flyway Migration Checksum Issue** (Blocking App Startup)

**Problem**: Migration V5 had a checksum mismatch preventing the application from starting.

**Solution**: Created repair scripts and documentation:

- `backend/scripts/fix-flyway-checksum.sh` (Linux/Mac)
- `backend/scripts/fix-flyway-checksum.ps1` (Windows)
- `backend/docs/FLYWAY_CHECKSUM_FIX.md` (Documentation)

**Action Required**: Run the repair script before starting the backend:

```bash
cd backend
# Linux/Mac:
./scripts/fix-flyway-checksum.sh

# Windows:
.\scripts\fix-flyway-checksum.ps1
```

---

### 2. **TC003: Mood Tracking API** - `/api/mood/checkin`

**Problem**: Test expected `/api/mood/checkin` but endpoint was `/api/mood/add`.

**Fix**: Added endpoint alias to support both paths.

**File**: `backend/src/main/java/com/mindease/controller/MoodController.java`

```java
@PostMapping({"/add", "/checkin"}) // Now supports both
```

**Status**: ✅ Fixed

---

### 3. **TC004: Journal Entry API** - `/api/journal`

**Problem**: Test expected POST to `/api/journal` but endpoint was `/api/journal/add`.

**Fix**: Added root path mapping to support POST requests at `/api/journal`.

**File**: `backend/src/main/java/com/mindease/controller/JournalController.java`

```java
@PostMapping({"/add", "", "/"}) // Now supports root path
```

**Status**: ✅ Fixed

---

### 4. **TC009: User Profile API** - `/api/user/profile`

**Problem**: Endpoint `/api/user/profile` did not exist.

**Fix**: Added new GET and PUT/PATCH endpoints for user profile.

**File**: `backend/src/main/java/com/mindease/controller/UserController.java`

**New Endpoints**:

- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile
- `PATCH /api/user/profile` - Update user profile

**Features**:

- Returns user ID, email, role, anonymous mode
- Returns quiet hours if configured
- Supports updating quiet hours and anonymous mode

**Status**: ✅ Fixed

---

### 5. **TC007: Subscription API** - `/api/subscription`

**Problem**: Test expected POST to `/api/subscription` but endpoint was `/api/subscription/create`.

**Fix**: Added root path mapping to support POST requests at `/api/subscription`.

**File**: `backend/src/main/java/com/mindease/controller/SubscriptionController.java`

```java
@PostMapping({"/create", ""}) // Now supports root path
```

**Status**: ✅ Fixed

---

## 📋 Next Steps

### 1. Fix Flyway Checksum (Required Before Starting)

Run the repair script:

```bash
cd backend
./scripts/fix-flyway-checksum.sh  # or .ps1 on Windows
```

### 2. Verify Environment Variables

Check these environment variables are set:

- `OPENAI_API_KEY` (for journal AI summaries)
- `STRIPE_SECRET_KEY` (for subscriptions)
- `STRIPE_PUBLISHABLE_KEY` (for subscriptions)
- `DATABASE_URL` or database config in `application.yml`
- `JWT_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_KEY`

### 3. Start the Backend

After fixing Flyway:

```bash
cd backend
mvn spring-boot:run
```

### 4. Test Endpoints

Test each fixed endpoint:

```bash
# 1. Login to get JWT token
curl -X POST http://localhost:8080/api/dev/login-test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Test Mood Checkin (use token from step 1)
curl -X POST http://localhost:8080/api/mood/checkin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moodValue": 7, "notes": "Feeling good"}'

# 3. Test Journal Entry
curl -X POST http://localhost:8080/api/journal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Today was a good day"}'

# 4. Test User Profile GET
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Test Subscription Create
curl -X POST http://localhost:8080/api/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billingPeriod": "monthly"}'
```

---

## 🔍 Troubleshooting

### Backend Still Won't Start

1. **Check Flyway repair completed**:

   ```bash
   mvn flyway:info
   ```

2. **Check database connection**:

   ```bash
   psql -h localhost -p 5432 -U mindease -d mindease
   ```

3. **Check logs**:
   ```bash
   tail -f backend/full_error.log
   ```

### Endpoints Return 500 Errors

1. **Check application logs** for stack traces
2. **Verify environment variables** are set
3. **Check database schema** is up to date
4. **Verify JWT token** is valid

### Endpoints Return 401 Unauthorized

1. **Verify JWT token** is included in Authorization header
2. **Check token format**: `Authorization: Bearer <token>`
3. **Verify token** hasn't expired

---

## ✅ Success Criteria

- [x] All 4 critical endpoints have correct paths
- [x] Flyway repair scripts created
- [x] User profile endpoint added
- [ ] Flyway checksum repaired (requires manual execution)
- [ ] Backend starts successfully
- [ ] All endpoints tested and working

---

**Last Updated**: [Date]
**Status**: Code fixes complete, requires Flyway repair before testing
