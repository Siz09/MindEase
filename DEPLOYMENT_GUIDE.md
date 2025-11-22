# MindEase Deployment Guide

## Overview

This guide covers the deployment process for MindEase, including environment setup, feature flag configuration, and monitoring.

## Prerequisites

- Docker & Docker Compose
- PostgreSQL database (production)
- Node.js 18+ (for frontend build)
- Java 17+ (for backend)
- SSL certificates (for production)

## Environment Setup

### Backend Environment Variables

```bash
# Application
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mindease
SPRING_DATASOURCE_USERNAME=mindease_user
SPRING_DATASOURCE_PASSWORD=<secure_password>

# JWT
JWT_SECRET=<secure_random_string>
JWT_EXPIRATION_MS=86400000

# Firebase
FIREBASE_PROJECT_ID=<your_project_id>
FIREBASE_PRIVATE_KEY=<your_private_key>
FIREBASE_CLIENT_EMAIL=<your_client_email>

# OpenAI
OPENAI_API_KEY=<your_openai_key>
OPENAI_MODEL=gpt-4

# Feature Flags
FEATURES_SAFETY_PIPELINE_ENABLED=true
FEATURES_MOOD_TRACKING_ENABLED=true
FEATURES_GUIDED_PROGRAMS_ENABLED=true
FEATURES_SESSION_SUMMARIES_ENABLED=false
FEATURES_CRISIS_RESOURCES_ENABLED=true

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Email (optional)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=<your_email>
SPRING_MAIL_PASSWORD=<your_password>
```

### Frontend Environment Variables

```bash
# API
VITE_API_BASE_URL=https://api.yourdomain.com

# Feature Flags
VITE_FEATURE_SAFETY_BANNERS=true
VITE_FEATURE_CRISIS_RESOURCES=true
VITE_FEATURE_MOOD_PROMPTS=true
VITE_FEATURE_MOOD_TRENDS=true
VITE_FEATURE_GUIDED_PROGRAMS=true
VITE_FEATURE_SESSION_SUMMARIES=false
VITE_FEATURE_VOICE_INPUT=false
VITE_FEATURE_VOICE_OUTPUT=false
VITE_FEATURE_VOICE_CONVERSATION=false
VITE_FEATURE_ANIMATIONS=true
VITE_FEATURE_DARK_MODE=true

# Analytics (optional)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Quick Setup)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/mindease.git
cd mindease

# 2. Create .env files
cp backend/.env.example backend/.env
cp apps/webapp/.env.example apps/webapp/.env

# 3. Update environment variables
nano backend/.env
nano apps/webapp/.env

# 4. Build and start services
docker-compose up -d

# 5. Check logs
docker-compose logs -f
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mindease
      POSTGRES_USER: mindease_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U mindease_user']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/mindease
      SPRING_DATASOURCE_USERNAME: mindease_user
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      FEATURES_SAFETY_PIPELINE_ENABLED: ${FEATURES_SAFETY_PIPELINE_ENABLED:-true}
      FEATURES_MOOD_TRACKING_ENABLED: ${FEATURES_MOOD_TRACKING_ENABLED:-true}
      FEATURES_GUIDED_PROGRAMS_ENABLED: ${FEATURES_GUIDED_PROGRAMS_ENABLED:-true}
    ports:
      - '8080:8080'
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/actuator/health']
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./apps/webapp
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
        VITE_FEATURE_SAFETY_BANNERS: ${VITE_FEATURE_SAFETY_BANNERS:-true}
        VITE_FEATURE_MOOD_PROMPTS: ${VITE_FEATURE_MOOD_PROMPTS:-true}
        VITE_FEATURE_GUIDED_PROGRAMS: ${VITE_FEATURE_GUIDED_PROGRAMS:-true}
    ports:
      - '3000:80'
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - '80:80'
      - '443:443'
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

### Option 2: Cloud Platform (Vercel + Railway)

#### Frontend (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend
cd apps/webapp

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# Go to: Project Settings > Environment Variables
```

#### Backend (Railway)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to backend
cd backend

# 4. Initialize project
railway init

# 5. Add PostgreSQL
railway add postgresql

# 6. Deploy
railway up

# 7. Set environment variables
railway variables set JWT_SECRET=<your_secret>
railway variables set OPENAI_API_KEY=<your_key>
# ... set other variables
```

### Option 3: Traditional VPS (Ubuntu)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Java 17
sudo apt install openjdk-17-jdk -y

# 3. Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 4. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Install Nginx
sudo apt install nginx -y

# 6. Create database
sudo -u postgres psql
CREATE DATABASE mindease;
CREATE USER mindease_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mindease TO mindease_user;
\q

# 7. Clone and build backend
git clone https://github.com/yourusername/mindease.git
cd mindease/backend
./mvnw clean package -DskipTests
sudo cp target/mindease-0.0.1-SNAPSHOT.jar /opt/mindease/

# 8. Create systemd service
sudo nano /etc/systemd/system/mindease.service
```

**mindease.service**:

```ini
[Unit]
Description=MindEase Backend
After=network.target postgresql.service

[Service]
Type=simple
User=mindease
WorkingDirectory=/opt/mindease
ExecStart=/usr/bin/java -jar /opt/mindease/mindease-0.0.1-SNAPSHOT.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mindease

Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mindease"
Environment="SPRING_DATASOURCE_USERNAME=mindease_user"
Environment="SPRING_DATASOURCE_PASSWORD=secure_password"
Environment="JWT_SECRET=your_jwt_secret"
Environment="OPENAI_API_KEY=your_openai_key"

[Install]
WantedBy=multi-user.target
```

```bash
# 9. Start backend service
sudo systemctl daemon-reload
sudo systemctl enable mindease
sudo systemctl start mindease

# 10. Build and deploy frontend
cd ../apps/webapp
npm install
npm run build
sudo cp -r dist/* /var/www/mindease/

# 11. Configure Nginx
sudo nano /etc/nginx/sites-available/mindease
```

**Nginx configuration**:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/mindease;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

```bash
# 12. Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/mindease /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 13. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## Phased Rollout Strategy

### Phase 1: Internal Testing (Week 1)

```bash
# Deploy to staging with all features enabled
FEATURES_SAFETY_PIPELINE_ENABLED=true
FEATURES_MOOD_TRACKING_ENABLED=true
FEATURES_GUIDED_PROGRAMS_ENABLED=true
FEATURES_SESSION_SUMMARIES_ENABLED=true

# Frontend
VITE_FEATURE_SAFETY_BANNERS=true
VITE_FEATURE_MOOD_PROMPTS=true
VITE_FEATURE_GUIDED_PROGRAMS=true
VITE_FEATURE_SESSION_SUMMARIES=true
```

**Checklist**:

- [ ] All features work as expected
- [ ] No console errors
- [ ] WebSocket connections stable
- [ ] Database migrations successful
- [ ] i18n works for both languages
- [ ] Mobile responsive
- [ ] Dark mode works

### Phase 2: Beta Testing (Week 2-3)

```bash
# Deploy to production with features enabled for 10% of users
# Use user ID hashing to determine feature access

# Backend: Implement percentage-based rollout
@Service
public class FeatureRolloutService {
    public boolean isUserInRollout(String userId, int percentage) {
        int hash = Math.abs(userId.hashCode() % 100);
        return hash < percentage;
    }
}

# Start with 10%, then 25%, then 50%
```

**Monitoring**:

- Track error rates
- Monitor API response times
- Check safety classification accuracy
- Collect user feedback
- Monitor database performance

### Phase 3: Full Rollout (Week 4)

```bash
# Enable all features for 100% of users
FEATURES_SAFETY_PIPELINE_ENABLED=true
FEATURES_MOOD_TRACKING_ENABLED=true
FEATURES_GUIDED_PROGRAMS_ENABLED=true
```

## Monitoring & Alerting

### Spring Boot Actuator Endpoints

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus,info
  metrics:
    export:
      prometheus:
        enabled: true
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mindease-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
```

### Grafana Dashboards

**Key Metrics to Monitor**:

1. API Response Time (p50, p95, p99)
2. Error Rate
3. WebSocket Connections
4. Database Query Performance
5. Safety Pipeline Metrics:
   - High-risk messages detected
   - Crisis resources displayed
   - Classification time
6. Mood Tracking Metrics:
   - Check-ins per day
   - Average mood score
7. Guided Programs Metrics:
   - Programs started
   - Programs completed
   - Completion rate

### Alerting Rules

```yaml
# alerts.yml
groups:
  - name: mindease_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: 'High error rate detected'

      - alert: HighRiskMessageSpike
        expr: rate(mindease_safety_high_risk_messages_total[5m]) > 10
        for: 5m
        annotations:
          summary: 'Unusual spike in high-risk messages'

      - alert: DatabaseConnectionPoolExhausted
        expr: hikaricp_connections_active >= hikaricp_connections_max
        for: 1m
        annotations:
          summary: 'Database connection pool exhausted'
```

## Rollback Procedure

If issues are detected:

### 1. Disable Features Immediately

```bash
# Backend
kubectl set env deployment/mindease-backend \
  FEATURES_SAFETY_PIPELINE_ENABLED=false \
  FEATURES_MOOD_TRACKING_ENABLED=false

# Frontend (Vercel)
vercel env rm VITE_FEATURE_SAFETY_BANNERS production
vercel env add VITE_FEATURE_SAFETY_BANNERS false production
vercel --prod
```

### 2. Rollback to Previous Version

```bash
# Docker
docker-compose down
git checkout <previous_commit>
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/mindease-backend
kubectl rollout undo deployment/mindease-frontend
```

### 3. Database Rollback (if needed)

```bash
# Flyway rollback
./mvnw flyway:undo -Dflyway.configFiles=flyway.conf
```

## Health Checks

### Backend Health Check

```bash
curl http://localhost:8080/actuator/health
```

Expected response:

```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

### Frontend Health Check

```bash
curl https://yourdomain.com
# Should return 200 OK
```

### WebSocket Health Check

```javascript
const ws = new WebSocket('wss://yourdomain.com/ws');
ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
```

## Backup & Recovery

### Database Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U mindease_user mindease > /backups/mindease_$DATE.sql
gzip /backups/mindease_$DATE.sql

# Keep only last 30 days
find /backups -name "mindease_*.sql.gz" -mtime +30 -delete
```

### Database Restore

```bash
gunzip /backups/mindease_20250121_120000.sql.gz
psql -U mindease_user mindease < /backups/mindease_20250121_120000.sql
```

## Security Checklist

- [ ] SSL/TLS enabled (HTTPS)
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] JWT secret is strong and unique
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (using prepared statements)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF protection (for forms)
- [ ] Security headers configured (Helmet.js or Spring Security)
- [ ] Regular dependency updates
- [ ] Vulnerability scanning enabled

## Performance Optimization

### Backend

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### Frontend

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
};
```

## Troubleshooting

### Common Issues

**1. WebSocket Connection Fails**

```bash
# Check Nginx WebSocket configuration
# Ensure proxy_http_version 1.1 and Upgrade headers are set
```

**2. Database Connection Pool Exhausted**

```bash
# Increase pool size or check for connection leaks
spring.datasource.hikari.maximum-pool-size=30
```

**3. High Memory Usage**

```bash
# Adjust JVM heap size
java -Xms512m -Xmx2g -jar mindease.jar
```

**4. Slow API Responses**

```bash
# Enable query logging and check for N+1 problems
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

---

**Last Updated**: November 21, 2025
**Version**: 1.0
**Status**: Ready for Production
