#!/bin/bash
# Verify Environment Variables and Database Configuration
# This script checks that all required environment variables and database connections are configured

echo "🔍 Verifying Environment Variables and Database Configuration..."
echo ""

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local required=$2
    local description=$3

    if [ -z "${!var_name}" ]; then
        if [ "$required" = "required" ]; then
            echo -e "${RED}❌ ${var_name}${NC} - ${description} (REQUIRED - NOT SET)"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠️  ${var_name}${NC} - ${description} (Optional - not set)"
            ((WARNINGS++))
        fi
    else
        echo -e "${GREEN}✅ ${var_name}${NC} - ${description}"
    fi
}

# Function to check file exists
check_file() {
    local file_path=$1
    local description=$2
    local required=$3

    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ ${file_path}${NC} - ${description}"
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}❌ ${file_path}${NC} - ${description} (REQUIRED - NOT FOUND)"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠️  ${file_path}${NC} - ${description} (Optional - not found)"
            ((WARNINGS++))
        fi
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Environment Variables Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Required Environment Variables
echo "🔴 Required Variables:"
check_env_var "OPENAI_API_KEY" "required" "Required for journal AI summaries"
check_env_var "JWT_SECRET" "optional" "JWT token secret (has dev default)"

# Stripe Configuration (Required for subscription features)
echo ""
echo "💳 Stripe Configuration (Required for Subscriptions):"
check_env_var "STRIPE_SECRET_KEY" "optional" "Stripe secret key (has dev default: sk_test_xxx)"
check_env_var "STRIPE_PUBLISHABLE_KEY" "optional" "Stripe publishable key (has dev default: pk_test_xxx)"
check_env_var "STRIPE_WEBHOOK_SECRET" "optional" "Stripe webhook secret (has dev default: whsec_xxx)"
check_env_var "STRIPE_PRICE_ID_MONTHLY" "optional" "Stripe monthly price ID"
check_env_var "STRIPE_PRICE_ID_ANNUAL" "optional" "Stripe annual price ID"

# Email Configuration (Optional)
echo ""
echo "📧 Email Configuration (Optional):"
check_env_var "EMAIL_USERNAME" "optional" "Email username for notifications"
check_env_var "EMAIL_PASSWORD" "optional" "Email password for notifications"

# Optional Environment Variables
echo ""
echo "⚙️  Optional Configuration:"
check_env_var "CHAT_FREE_DAILY_LIMIT" "optional" "Daily message limit for free users (default: 50)"
check_env_var "STRIPE_SUCCESS_URL" "optional" "Stripe success URL (has default)"
check_env_var "STRIPE_CANCEL_URL" "optional" "Stripe cancel URL (has default)"
check_env_var "CORS_ALLOWED_ORIGINS" "optional" "CORS allowed origins (has default)"
check_env_var "DATABASE_URL" "optional" "Database connection URL (using application.yml defaults)"

# File Checks
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Required Files Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file "src/main/resources/firebase-service-account.json" "Firebase service account JSON (required for auth)" "required"
check_file "src/main/resources/application.yml" "Application configuration file" "required"
check_file "src/main/resources/application-dev.yml" "Development profile configuration" "optional"

# Database Connection Check
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Database Configuration Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-mindease}
DB_USER=${DB_USER:-mindease}
DB_PASSWORD=${DB_PASSWORD:-secret}

echo "Database Configuration:"
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo ""

# Check if PostgreSQL is accessible
echo "Checking database connection..."
if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"

        # Check if required tables exist
        echo ""
        echo "Checking required tables..."
        TABLES=("users" "mood_entries" "journal_entries" "subscriptions" "audit_logs" "notifications" "messages" "chat_sessions")
        for table in "${TABLES[@]}"; do
            if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "\dt ${table}" >/dev/null 2>&1; then
                echo -e "${GREEN}  ✅ Table: ${table}${NC}"
            else
                echo -e "${YELLOW}  ⚠️  Table: ${table} (not found - may need to run migrations)${NC}"
                ((WARNINGS++))
            fi
        done
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "   Make sure PostgreSQL is running and accessible"
        echo "   Command: docker-compose up -d (from backend/docker directory)"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠️  psql not found - skipping database connection check${NC}"
    echo "   Install PostgreSQL client or use Docker to verify connection"
    ((WARNINGS++))
fi

# Check if Docker is available (for database)
echo ""
if command -v docker >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    if docker ps | grep -q postgres; then
        echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL container not running${NC}"
        echo "   Start with: cd backend/docker && docker-compose up -d"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found - cannot check container status${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Environment is properly configured.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuration complete with ${WARNINGS} warning(s)${NC}"
    echo "   Review warnings above - application may work but some features may be limited"
    exit 0
else
    echo -e "${RED}❌ Configuration incomplete: ${ERRORS} error(s), ${WARNINGS} warning(s)${NC}"
    echo ""
    echo "Required fixes:"
    echo "  1. Set missing required environment variables"
    echo "  2. Ensure Firebase service account file exists"
    echo "  3. Verify database is running and accessible"
    echo ""
    echo "See backend/docs/ENVIRONMENT_SETUP.md for detailed setup instructions"
    exit 1
fi
