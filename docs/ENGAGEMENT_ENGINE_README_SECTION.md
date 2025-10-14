## Notifications & Engagement Engine (Phase 5)

- Purpose: Drive user re-engagement with gentle, privacy‑aware prompts via in‑app and optional email channels.
- Scope: In‑app notifications UI, unread badge and toasts, user‑configurable quiet hours, and an hourly inactivity detection job.

### Backend

- Entities
  - `backend/src/main/java/com/mindease/model/Notification.java`
  - `backend/src/main/java/com/mindease/model/UserActivity.java`
- Services & Jobs
  - `InactivityDetectionService` runs hourly (`@Scheduled(cron = "0 0 * * * *")`) and creates reminders for users inactive ≥ 3 days while respecting quiet hours.
  - `NotificationService` persists notifications and can send queued email notifications (via `EmailService`) when not in user quiet hours.
  - `EmailService` uses Spring `JavaMailSender` with retries and async delivery.
- API Endpoints
  - `GET /api/notifications/list` – Paginated notifications for current user
  - `GET /api/notifications/unread-count` – Unread in‑app count
  - `PATCH /api/notifications/mark-read/{id}` – Mark single notification read
  - `PATCH /api/notifications/mark-all-read` – Mark all read
  - `DELETE /api/notifications/{id}` – Delete a notification
  - `PATCH /api/user/quiet-hours` – Update `quietHoursStart`/`quietHoursEnd` for current user
  - Dev only (profile `dev`): `POST /api/dev/trigger-inactivity-detection` – Manually run the job for QA
- Configuration (`backend/src/main/resources/application.yml`)
  - `inactivity.quiet-hours.start` and `inactivity.quiet-hours.end` – system quiet hours used by the job
  - Spring Mail: `spring.mail.*` and `mindease.mail.from` for email delivery
  - Scheduling/Async enabled in `MindeaseBackendApplication` via `@EnableScheduling` and `@EnableAsync`

Notes

- Inactivity reminders are created with type "INACTIVITY_REMINDER". The current web UI shows only `IN_APP` items. Use the API list endpoint to validate reminder creation, or adjust UI filtering as needed for QA.
- Anonymous users are skipped by inactivity detection by design.

### Frontend

- Components
  - `apps/webapp/src/components/NotificationBell.jsx` – Unread badge + navigation to notifications
  - `apps/webapp/src/pages/Notifications.jsx` – In‑app list with mark‑as‑read and mark‑all‑read
  - `apps/webapp/src/hooks/useNotifications.js` – Fetch, unread count, poll, and new‑item detection for toasts
  - `apps/webapp/src/pages/Settings.jsx` – Quiet hours UI bound to `PATCH /api/user/quiet-hours`
- Behavior
  - Polls notifications (default 15s) and shows real‑time toast for new in‑app items (`react‑toastify`).
  - Unread count surfaced in the bell and page header.
  - Quiet hours allow per‑user start/end; identical start=end disables quiet hours.

### End of Phase 5 Deliverables

- Backend: Notification & UserActivity entities, scheduled inactivity job, quiet hours, email service
- Frontend: Notification bell, in‑app list with toasts, quiet hours UI
- Integration: Connected backend–frontend notification endpoints
- Testing: Postman/browser flows and offline/inactive user simulation
- Documentation: Updated README + TESTING_GUIDE
