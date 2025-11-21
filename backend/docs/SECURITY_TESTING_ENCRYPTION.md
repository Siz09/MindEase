# Encryption & TLS Verification Plan

## 1. Goals

- Ensure data is encrypted in transit (HTTPS/TLS).
- Verify appropriate encryption/handling of sensitive data at rest.
- Confirm that PII and secrets are handled securely.

## 2. HTTPS/TLS Verification

> Note: TLS is typically terminated at a reverse proxy/load balancer (e.g., Nginx, Cloudflare, AWS ALB), not inside the Spring Boot app itself.

### 2.1 Development

- Dev environment may use plain HTTP (`http://localhost:8080`).
- For local TLS testing, consider:
  - Running Spring Boot with a self-signed certificate, or
  - Placing Nginx/Traefik in front of the app with TLS enabled.

### 2.2 Staging/Production Checklist

- [ ] Application is only accessible via `https://` URLs.
- [ ] TLS version is 1.2 or higher.
- [ ] Strong cipher suites are enabled (no deprecated ciphers).
- [ ] Automatic certificate renewal configured (Let’s Encrypt or provider tools).

**Tools**:

- SSL Labs Server Test: verify TLS configuration and grade.
- `openssl s_client -connect host:443` for low-level inspection.

## 3. Database Encryption at Rest

PostgreSQL itself typically does not encrypt data at rest by default. Encryption is usually handled by:

- Disk/volume encryption (e.g., AWS EBS encryption, LUKS on Linux).
- Managed database services with built-in encryption (e.g., RDS, Cloud SQL).

### Checklist

- [ ] Verify that production database volumes are encrypted (cloud provider or OS level).
- [ ] Ensure database backups/snapshots are encrypted.
- [ ] Restrict database access to application and admin roles only.

## 4. Sensitive Data Encryption / Hashing

### 4.1 Passwords

- User passwords (where present) should be stored as **bcrypt hashes**.
- In MindEase:
  - Admin/demo user passwords seeded via migrations use bcrypt (`V24__demo_admin_user.sql`).
  - `UserService` uses `BCryptPasswordEncoder` for password hashing.

**Checklist**:

- [x] Verify passwords are never stored in plain text.
- [x] Verify `BCryptPasswordEncoder` is used consistently.
- [ ] Consider increasing bcrypt cost factor for production if performance allows.

### 4.2 Tokens & Secrets

- JWT secret (`JWT_SECRET`) is stored as an environment variable.
- Stripe and OpenAI keys are stored as environment variables.
- Firebase service account JSON is stored as a file (gitignored).

**Checklist**:

- [x] Ensure secrets are not committed to version control.
- [x] Ensure `.env` files are gitignored.
- [ ] Use secret management service in production (AWS Secrets Manager, Azure Key Vault, etc.).
- [ ] Limit access to environment variables in CI/CD and runtime.

## 5. PII Handling

PII (Personally Identifiable Information) in MindEase includes:

- Email addresses
- Potentially sensitive chat/journal content (though pseudonymous)

**Checklist**:

- [ ] Review logs to ensure PII is not logged in plaintext.
- [ ] Ensure access controls prevent unauthorized access to PII (admin endpoints protected by role).
- [ ] Define retention policies (already partially implemented via `RetentionPolicyService`).

## 6. Results Tracking

| Area                      | Status | Notes                                  |
| ------------------------- | ------ | -------------------------------------- |
| HTTPS enforced (prod)     |        |                                        |
| TLS config reviewed       |        |                                        |
| DB volumes encrypted      |        |                                        |
| Backups encrypted         |        |                                        |
| Password hashing verified | ✅     | BCrypt used in UserService & seed data |
| Secret storage reviewed   |        |                                        |
| PII logging reviewed      |        |                                        |

## 7. Conclusion

Encryption is a cross-cutting concern that depends heavily on deployment environment. This plan:

- Documents what is already handled in code (password hashing, secret separation).
- Provides a concrete checklist for environment-level encryption and TLS.

Environment-specific verification should be performed in staging/production using cloud provider tools and SSL Labs.

{
"cells": [],
"metadata": {
"language_info": {
"name": "python"
}
},
"nbformat": 4,
"nbformat_minor": 2
}
