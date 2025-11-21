# SQL Injection Testing Plan

## 1. Goals

- Verify that all backend endpoints are resistant to SQL injection.
- Confirm that all database access uses parameterized queries / prepared statements.
- Provide a repeatable test plan for security testing tools (OWASP ZAP, Burp Suite) and manual testing.

---

## 2. Backend Query Review (Completed)

### 2.1 Spring Data Repositories

Reviewed all repositories using `@Query`:

- `UserRepository`
- `CrisisFlagRepository`
- `AuditLogRepository`
- `SubscriptionRepository`
- `NotificationRepository`
- `MindfulnessSessionRepository`
- `JournalEntryRepository`
- `MoodEntryRepository`
- `StripeEventRepository`

All queries:

- Use JPQL with named parameters (`:userId`, `:status`, etc.).
- Do **not** concatenate user input into query strings.
- Rely on Spring Data JPA prepared statements under the hood.

### 2.2 Custom Repositories (`AnalyticsRepository`, `AuditLogRepositoryImpl`, etc.)

- Use `EntityManager#createNativeQuery(sql)` with `setParameter(...)` for all user inputs.
- No dynamic SQL string concatenation with request parameters.
- All user-controlled values are bound as parameters, leveraging prepared statements.

Conclusion: **No obvious SQL injection vector from backend query construction.**

---

## 3. Manual SQL Injection Test Scenarios

Use these scenarios with Postman, curl, or security tools (ZAP/Burp).

### 3.1 Authentication Endpoints
