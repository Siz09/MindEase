# Notifications & Engagement Testing

## 1. Notification Endpoints (Postman or curl)

- Prerequisites
  - Backend running with dev profile (default per `application.yml`).
  - Obtain a valid JWT via login; set `Authorization: Bearer <token>`.

- Steps
  - List notifications
    - `GET {{BASE_URL}}/api/notifications/list?page=0&size=10`
    - Expect: 200 OK with `content` array and `totalElements`.
  - Unread count
    - `GET {{BASE_URL}}/api/notifications/unread-count`
    - Expect: 200 OK with `{ "unreadCount": <number> }`.
  - Mark as read (prepare an existing `id` from the list response)
    - `PATCH {{BASE_URL}}/api/notifications/mark-read/{{id}}`
    - Expect: 200 OK with `{ "status": "ok" }` and `isRead=true` on subsequent list.
  - Mark all as read
    - `PATCH {{BASE_URL}}/api/notifications/mark-all-read`
    - Expect: 200 OK with `{ message, count }` and unread count becomes 0.
  - Delete a notification
    - `DELETE {{BASE_URL}}/api/notifications/{{id}}`
    - Expect: 200 OK with `message` or 404 if not found.

Notes

- Inactivity reminders are stored with type `INACTIVITY_REMINDER`. The current UI shows only `IN_APP` items; use the API list to verify reminder creation or adjust UI filtering for QA.

## 2. Quiet Hours Scenarios

- Update quiet hours (current user)
  - `PATCH {{BASE_URL}}/api/user/quiet-hours`
  - Body:
    ```json
    { "quietHoursStart": "22:00:00", "quietHoursEnd": "08:00:00" }
    ```
  - Expect: 200 OK with updated user object including `quietHoursStart` and `quietHoursEnd`.

- Scenarios to validate
  - Normal hours: Set a window that does not include current time; inactivity job may create reminders.
  - Quiet hours same day: Set a range where `start < end` and confirm reminders are skipped during that window.
  - Quiet hours overnight: Set `start > end` (e.g., `22:00:00` → `07:00:00`) and confirm reminders are skipped across midnight.
  - Disabled: Set `start == end` (e.g., `00:00:00` and `00:00:00`) and confirm quiet hours are effectively off.

## 3. Email Verification (optional)

- Configure SMTP
  - Set `spring.mail.host`, `spring.mail.port`, credentials, and `mindease.mail.from` in `application.yml` or environment variables.
  - Use a safe test inbox or a local SMTP sink for QA.

- Smoke validation
  - Start backend and watch logs; the `EmailService` logs success/fail for `sendEmail(...)`.
  - Developers can manually invoke `NotificationService.sendQueuedNotifications(user)` in a short, dev‑only harness or unit test to verify delivery and that `isSent` toggles to `true`.
  - If no harness is available, limit verification to SMTP connectivity (connection/auth OK) and logging.

## 4. Final Regression (Phase 5)

- Inactivity detection job runs correctly
  - Dev trigger: `POST {{BASE_URL}}/api/dev/trigger-inactivity-detection` (profile `dev` only)
  - Seed an inactive user (≥ 3 days) per `backend/INACTIVITY_TESTING.md` and verify a reminder notification is created.
- In‑app notifications trigger properly
  - New in‑app notification appears in the list and triggers toast on arrival; unread badge increments; mark‑as‑read updates count.
- Email notifications respected
  - If SMTP configured and a dev harness calls queued sending, confirm delivery and `isSent=true` persistence.
- Quiet hours respected
  - During configured quiet window, inactivity reminders are skipped; outside, they proceed.
