# Environment & Database Verification Checklist

## 📋 Quick Verification Checklist

Use this checklist to verify your environment is properly configured before starting the backend.

### 🔴 Required - Must Have

- [ ] **OpenAI API Key**
  - [ ] `OPENAI_API_KEY` environment variable set
  - [ ] Valid API key (starts with `sk-proj-...` or `sk-...`)
  - [ ] Test: Can be verified via OpenAI API dashboard

- [ ] **Firebase Service Account**
  - [ ] File exists: `backend/src/main/resources/firebase-service-account.json`
  - [ ] Valid JSON format
  - [ ] Contains required Firebase credentials

- [ ] **PostgreSQL Database**
  - [ ] PostgreSQL is running (Docker or manual installation)
  - [ ] Database `mindease` exists
  - [ ] User `mindease` exists with password `secret`
  - [ ] Connection test: `psql -h localhost -p 5432 -U mindease -d mindease`

### 💳 Stripe Configuration (Required for Subscriptions)

- [ ] **Stripe API Keys**
  - [ ] `STRIPE_SECRET_KEY` set (starts with `sk_test_...` or `sk_live_...`)
  - [ ] `STRIPE_PUBLISHABLE_KEY` set (starts with `pk_test_...` or `pk_live_...`)
  - [ ] `STRIPE_WEBHOOK_SECRET` set (starts with `whsec_...`)
  - [ ] `STRIPE_PRICE_ID_MONTHLY` set (starts with `price_...`)
  - [ ] `STRIPE_PRICE_ID_ANNUAL` set (starts with `price_...`)

### ⚙️ Optional Configuration

- [ ] **Email Notifications**
  - [ ] `EMAIL_USERNAME` set (if using email notifications)
  - [ ] `EMAIL_PASSWORD` set (if using email notifications)

- [ ] **JWT Secret**
  - [ ] `JWT_SECRET` set (has dev default, required for production)

- [ ] **Other Optional Variables**
  - [ ] `CHAT_FREE_DAILY_LIMIT` (default: 50)
  - [ ] `CORS_ALLOWED_ORIGINS` (has default)

## 🔧 Automated Verification

### Run Verification Script

**Linux/Mac**:

```bash
cd backend
./scripts/verify-environment.sh
```

**Windows (PowerShell)**:

```powershell
cd backend
.\scripts\verify-environment.ps1
```

### Check Database Connection

**Linux/Mac**:

```bash
cd backend
./scripts/check-database.sh
```

**Windows (PowerShell)**:

```powershell
cd backend
.\scripts\check-database.ps1
```

## 📊 Verification Results

The scripts will output:

- ✅ **Green checkmarks**: Configuration is correct
- ⚠️ **Yellow warnings**: Optional configuration missing (app may still work)
- ❌ **Red errors**: Required configuration missing (app won't work)

## ✅ Success Criteria

Before starting the backend, ensure:

- ✅ All required environment variables are set (green checkmarks)
- ✅ Firebase service account file exists
- ✅ Database connection is successful
- ⚠️ Optional variables may show warnings (OK if you don't need those features)

## 🚀 After Verification

Once verification passes:

1. Run Flyway repair script (if needed)
2. Start the backend: `mvn spring-boot:run`
3. Test health endpoint: `curl http://localhost:8080/actuator/health`
4. Proceed with endpoint testing

---

**See Also**:

- `backend/docs/ENVIRONMENT_SETUP.md` - Detailed setup guide
- `backend/.env.example` - Environment variable template
