# Environment Variables & Database Configuration Guide

## 📋 Overview

This guide documents all required and optional environment variables, database configuration, and how to verify your setup.

## 🔴 Required Environment Variables

### Critical (Application Won't Work Without These)

| Variable                        | Description                    | Default | Required For                         |
| ------------------------------- | ------------------------------ | ------- | ------------------------------------ |
| `OPENAI_API_KEY`                | OpenAI API key for AI features | None    | Journal AI summaries, chat responses |
| `firebase-service-account.json` | Firebase service account file  | None    | User authentication                  |

### Database Configuration (via application.yml or env vars)

Default values in `application.yml`:

- Host: `localhost`
- Port: `5432`
- Database: `mindease`
- Username: `mindease`
- Password: `secret`

## 💳 Stripe Configuration (Required for Subscriptions)

| Variable                  | Description                   | Dev Default   | Production  |
| ------------------------- | ----------------------------- | ------------- | ----------- |
| `STRIPE_SECRET_KEY`       | Stripe secret API key         | `sk_test_xxx` | ✅ Required |
| `STRIPE_PUBLISHABLE_KEY`  | Stripe publishable key        | `pk_test_xxx` | ✅ Required |
| `STRIPE_WEBHOOK_SECRET`   | Webhook signing secret        | `whsec_xxx`   | ✅ Required |
| `STRIPE_PRICE_ID_MONTHLY` | Monthly subscription price ID | None          | ✅ Required |
| `STRIPE_PRICE_ID_ANNUAL`  | Annual subscription price ID  | None          | ✅ Required |

**Get Stripe Keys:**

1. Sign up at https://stripe.com
2. Go to Dashboard > Developers > API Keys
3. Copy Secret Key and Publishable Key
4. For webhook secret: Dashboard > Developers > Webhooks > Add endpoint > Copy signing secret
5. For price IDs: Dashboard > Products > Create price > Copy price ID

## 📧 Email Configuration (Optional)

| Variable         | Description                      | Required |
| ---------------- | -------------------------------- | -------- |
| `EMAIL_USERNAME` | SMTP email username              | No       |
| `EMAIL_PASSWORD` | SMTP email password/app password | No       |

**Note**: Email notifications won't work without these, but the app will run.

## ⚙️ Optional Environment Variables

| Variable                 | Description                           | Default                                          |
| ------------------------ | ------------------------------------- | ------------------------------------------------ |
| `JWT_SECRET`             | JWT token signing secret              | `dev-jwt-secret-key...` (dev only)               |
| `CHAT_FREE_DAILY_LIMIT`  | Daily message limit for free users    | `50`                                             |
| `STRIPE_SUCCESS_URL`     | Redirect URL after successful payment | `http://localhost:5173/subscription/success?...` |
| `STRIPE_CANCEL_URL`      | Redirect URL after cancelled payment  | `http://localhost:5173/subscription/cancel`      |
| `CORS_ALLOWED_ORIGINS`   | Allowed CORS origins                  | `http://localhost:5173`                          |
| `CORS_ALLOWED_METHODS`   | Allowed HTTP methods                  | `GET,POST,PUT,DELETE,OPTIONS`                    |
| `CORS_ALLOWED_HEADERS`   | Allowed request headers               | `Authorization,Content-Type`                     |
| `CORS_ALLOW_CREDENTIALS` | Allow credentials in CORS             | `true`                                           |

## 📁 Required Files

### Firebase Service Account JSON

**Location**: `backend/src/main/resources/firebase-service-account.json`

**How to get it:**

1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: `mentalhealth-99210`
3. Project Settings (gear icon) > Service Accounts
4. Click "Generate new private key"
5. Save as `firebase-service-account.json` in `backend/src/main/resources/`

**⚠️ Important**: This file contains sensitive credentials. It's gitignored for security.

## 🗄️ Database Configuration

### Default Configuration (Development)

The application uses PostgreSQL with these defaults:

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `mindease`
- **Username**: `mindease`
- **Password**: `secret`

### Setup Database with Docker (Recommended)

```bash
# Navigate to docker directory
cd backend/docker

# Start PostgreSQL container
docker-compose up -d

# Verify it's running
docker ps

# Check logs
docker-compose logs postgres
```

### Manual PostgreSQL Setup

1. Install PostgreSQL 15+
2. Create database:
   ```sql
   CREATE DATABASE mindease;
   CREATE USER mindease WITH PASSWORD 'secret';
   GRANT ALL PRIVILEGES ON DATABASE mindease TO mindease;
   ```
3. Verify connection:
   ```bash
   psql -h localhost -p 5432 -U mindease -d mindease
   ```

### Database Migration

The application uses Flyway for database migrations. Migrations run automatically on startup.

**Required Tables** (created automatically):

- `users`
- `mood_entries`
- `journal_entries`
- `subscriptions`
- `audit_logs`
- `notifications`
- `messages`
- `chat_sessions`
- `user_activity`
- `crisis_flags`
- `mindfulness_sessions`

## ✅ Verification Scripts

### Linux/Mac

```bash
cd backend
chmod +x scripts/verify-environment.sh
./scripts/verify-environment.sh
```

### Windows (PowerShell)

```powershell
cd backend
.\scripts\verify-environment.ps1
```

### What the Script Checks

- ✅ All required environment variables are set
- ✅ Optional environment variables (with warnings)
- ✅ Required files exist (Firebase service account, config files)
- ✅ Database connection is accessible
- ✅ Required database tables exist

## 🔧 Setting Environment Variables

### Linux/Mac (bash/zsh)

```bash
# Option 1: Export in terminal
export OPENAI_API_KEY="sk-proj-..."
export STRIPE_SECRET_KEY="sk_test_..."

# Option 2: Add to ~/.bashrc or ~/.zshrc
echo 'export OPENAI_API_KEY="sk-proj-..."' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use .env file (if using dotenv tool)
# Copy backend/.env.example to backend/.env and fill in values
```

### Windows (PowerShell)

```powershell
# Option 1: Set for current session
$env:OPENAI_API_KEY = "sk-proj-..."
$env:STRIPE_SECRET_KEY = "sk_test_..."

# Option 2: Set permanently
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-proj-...", "User")

# Option 3: Use .env file
# Copy backend\.env.example to backend\.env and fill in values
```

### Docker/Production

For production deployments, use:

- Environment variables in deployment platform (Heroku, AWS, Azure)
- Secret management services (AWS Secrets Manager, Azure Key Vault)
- CI/CD pipeline secrets

**Never commit `.env` files or secrets to version control!**

## 🚀 Quick Start Checklist

Before starting the backend:

- [ ] **Required**:
  - [ ] `OPENAI_API_KEY` environment variable set
  - [ ] `firebase-service-account.json` file in `backend/src/main/resources/`
  - [ ] PostgreSQL running (Docker or manual)
  - [ ] Database `mindease` created

- [ ] **For Subscriptions** (if testing payment features):
  - [ ] `STRIPE_SECRET_KEY` set
  - [ ] `STRIPE_PUBLISHABLE_KEY` set
  - [ ] `STRIPE_WEBHOOK_SECRET` set
  - [ ] Stripe price IDs configured

- [ ] **Optional**:
  - [ ] Email credentials set (for email notifications)
  - [ ] Custom JWT_SECRET set (for production)
  - [ ] Custom database connection (if not using defaults)

## 🧪 Testing Configuration

After setting up environment variables:

1. **Run verification script**:

   ```bash
   ./scripts/verify-environment.sh  # or .ps1 on Windows
   ```

2. **Start backend**:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Verify health endpoint**:

   ```bash
   curl http://localhost:8080/actuator/health
   ```

4. **Check logs** for any configuration errors:
   ```bash
   tail -f backend/full_error.log
   ```

## 📝 Environment Variables Reference

See `backend/.env.example` for a complete template with all available environment variables and their descriptions.

## 🔒 Security Best Practices

1. **Never commit secrets** to version control
2. **Use different keys** for development and production
3. **Rotate secrets regularly** (especially JWT_SECRET)
4. **Use secret management** services in production
5. **Limit API key permissions** (use least privilege principle)
6. **Monitor API usage** to detect unauthorized access

## 🆘 Troubleshooting

### Database Connection Issues

**Error**: `Connection refused` or `Connection timeout`

**Solutions**:

1. Verify PostgreSQL is running: `docker ps` or `psql --version`
2. Check database credentials in `application.yml`
3. Verify port 5432 is not blocked by firewall
4. Check Docker container logs: `docker-compose logs postgres`

### Missing Environment Variables

**Error**: `OPENAI_API_KEY not found` or similar

**Solutions**:

1. Run verification script to identify missing variables
2. Set environment variables as shown above
3. Verify variable names match exactly (case-sensitive)
4. Restart application after setting variables

### Firebase Initialization Error

**Error**: `Failed to initialize Firebase Admin SDK`

**Solutions**:

1. Verify `firebase-service-account.json` exists in `backend/src/main/resources/`
2. Check file is valid JSON format
3. Verify file contains all required fields
4. Check file permissions (should be readable)

### Stripe Configuration Issues

**Error**: `StripeException` or payment failures

**Solutions**:

1. Verify Stripe keys are correct (test vs production)
2. Check webhook secret matches Stripe dashboard
3. Verify price IDs exist in Stripe dashboard
4. Check Stripe account is active and not restricted

---

**Last Updated**: 2025-01-29
**See Also**:

- `backend/scripts/verify-environment.sh` (or `.ps1`) - Automated verification
- `backend/.env.example` - Environment variable template
