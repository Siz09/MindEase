# Admin Dashboard – Testing Guide

## Pre-requisites

- Backend running with migrations applied (Flyway) and database reachable.
- Admin user seeded for dev:
  - Email: `admin@mindease.com`
  - Password: `admin123` (dev only)
  - Firebase custom claim: `role: ADMIN`
- Frontend running, Firebase config points to the same project.
- Method security enabled on admin endpoints (`@PreAuthorize("hasRole('ADMIN')")`).

## Functional Checks

### 1) RBAC

- Non-admin visiting `/admin` → redirected to `/`.
- Admin visiting `/admin` → access granted and data loads.
- API checks (Postman):
  - No/invalid token → 401
  - Valid non-admin token → 403
  - Admin token → 200

### 2) Audit Logs

1. As a normal user:
   - Login → send a chat → add mood → add journal.
2. Validate in DB:
   ```sql
   SELECT action_type, user_id, created_at
   FROM audit_logs
   ORDER BY created_at DESC
   LIMIT 20;
   ```
   Expect `LOGIN`, `CHAT_SENT`, `MOOD_ADDED`, `JOURNAL_ADDED` present.
3. As admin in UI:
   - Navigate to `/admin/audit-logs`
   - Filter by date/action/email; entries paginate and sort by newest.

### 3) Crisis Flags (real-time)

1. As a normal user, send a crisis phrase (e.g., “I feel suicidal”).
2. Validate in DB:
   ```sql
   SELECT keyword_detected, risk_score, created_at
   FROM crisis_flags
   ORDER BY created_at DESC
   LIMIT 10;
   ```
   Expect normalized keyword such as `suicide`, and a `risk_score` if scoring is enabled.
3. As admin:
   - Open `/admin/crisis-flags`
   - Expect the new flag to appear near the top.
   - If SSE is enabled: appears without reload; otherwise appears on next poll (default 10s).
4. Admin notifications (if implemented):
   - In-app notification appears for admins.
   - If email is enabled in dev, check console/logs or mail sink.

### 4) Analytics

- In `/admin` Overview, pick a date range (e.g., last 7 days) and compare charts to DB queries.

Daily active users (distinct):

```sql
SELECT DATE(created_at) AS day, COUNT(DISTINCT user_id) AS dau
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY day ORDER BY day;
```

AI usage (chat calls):

```sql
SELECT DATE(created_at) AS day, COUNT(*) AS calls
FROM audit_logs
WHERE action_type = 'CHAT_SENT'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY day ORDER BY day;
```

Mood correlation (avg mood and sessions):

```sql
WITH moods AS (
  SELECT DATE(created_at) AS day, AVG(mood_value)::float8 AS avg_mood
  FROM mood_entries
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY day
),
chats AS (
  SELECT DATE(created_at) AS day, COUNT(*) AS chat_count
  FROM audit_logs
  WHERE action_type = 'CHAT_SENT'
    AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY day
)
SELECT d.day, m.avg_mood, c.chat_count
FROM (
  SELECT generate_series(CURRENT_DATE - 7, CURRENT_DATE, '1 day') AS day
)
d
LEFT JOIN moods m ON m.day = d.day
LEFT JOIN chats c ON c.day = d.day
ORDER BY d.day;
```

### 5) Export

- In `Audit Logs` and `Crisis Flags`, click Export CSV.
- Open CSV in a spreadsheet; headers present, commas/quotes escaped, and date/time values parse.

## API References

- `GET /api/admin/active-users?from=<ISO>&to=<ISO>`
- `GET /api/admin/ai-usage?from=<ISO>&to=<ISO>`
- `GET /api/admin/mood-correlation?from=<ISO>&to=<ISO>`
- `GET /api/admin/audit-logs?page=0&size=25&actionType=&from=&to=&email=`
- `GET /api/admin/crisis-flags?page=0&size=25&from=&to=`
- (Optional) `GET /api/admin/crisis-flags/stream` for SSE

## Troubleshooting

- 403 on admin endpoints → missing `role: ADMIN` claim or method security disabled.
- Crisis not appearing → SSE not connected; fallback poll interval ~10s.
- Analytics mismatch → check server timezone and client date range.
- Firebase `auth/invalid-credential` → wrong API key, unauthorized domain, or missing user.

> Rotate or remove the demo admin before any production deployment.

## Backend Notes

- Crisis Flags date filters
  - Supports partial ranges: providing only `from` means [from, now], only `to` means [epoch, to].
  - If both `from` and `to` are provided and `from > to`, the API returns `400 Bad Request` with message `from must be before or equal to to`.

- SSE limits and behavior
  - `/api/admin/crisis-flags/stream` caps concurrent connections (HTTP 429 if limit reached).
  - A connection is only registered after an initial `open` event is delivered; failed opens are closed and not retained.

## Postman RBAC Quickstart (Local)

- Use the provided collection: `postman/MindEase_Full_API.postman_collection.json`
- Import environment: `postman/mindease_local.postman_environment.json`
- Run "Auth → Dev Login Admin" to set `{{adminToken}}`.
- Run "Auth → Dev Login User" to set `{{userToken}}` and `{{userId}}`.
- All admin requests send `Authorization: Bearer {{adminToken}}`; user requests use `{{userToken}}`.

Notes

- Dev login endpoint: `POST /api/dev/login-test` (available in `dev` profile only).
- SSE testing: prefer browser or `curl -N` for `GET /api/admin/crisis-flags/stream` (Postman does not support SSE).
