# Inactivity Detection Testing Guide

## Overview

This guide explains how to test the inactivity detection system implemented in Phase 5 - Day 2.

## Components Implemented

### 1. NotificationService

- **Location**: `com.mindease.service.NotificationService`
- **Purpose**: Creates and manages notifications for users
- **Key Method**: `createNotification(User user, String type, String message)`

### 2. InactivityDetectionService

- **Location**: `com.mindease.service.InactivityDetectionService`
- **Purpose**: Detects inactive users and sends gentle reminders
- **Scheduled Job**: Runs every hour (`@Scheduled(cron = "0 0 * * * *")`)
- **Inactivity Threshold**: 3 days
- **Quiet Hours**: 10 PM to 8 AM (no notifications sent during these hours)

### 3. User Activity Tracking

- **Location**: `com.mindease.service.UserService.trackUserActivity()`
- **Triggered on**:
  - User login/registration
  - Chat message sending
  - Journal entry creation
  - Mood entry creation

## Testing Steps

### Step 1: Create Test Data

```sql
-- Insert a test user with activity from 4 days ago (simulating inactivity)
INSERT INTO users (id, email, password_hash, role, anonymous_mode, created_at, updated_at, firebase_uid)
VALUES (
    gen_random_uuid(),
    'test@example.com',
    '$2a$10$dummy.hash',
    'USER',
    false,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    'test-firebase-uid'
);

-- Insert user activity from 4 days ago
INSERT INTO user_activity (id, user_id, last_active_at)
SELECT
    gen_random_uuid(),
    u.id,
    NOW() - INTERVAL '4 days'
FROM users u
WHERE u.email = 'test@example.com';
```

### Step 2: Manual Trigger (Development Mode)

```bash
# Trigger inactivity detection manually
curl -X POST http://localhost:8080/api/dev/trigger-inactivity-detection
```

### Step 3: Verify Results

```sql
-- Check if notification was created
SELECT n.*, u.email
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.email = 'test@example.com'
AND n.message LIKE '%inactive%';
```

### Step 4: Test Duplicate Prevention

```bash
# Run the trigger again - should not create duplicate notifications
curl -X POST http://localhost:8080/api/dev/trigger-inactivity-detection
```

### Step 5: Test Quiet Hours

The system automatically skips notifications between 10 PM and 8 AM.

## Expected Behavior

1. **Active Users**: No notifications sent
2. **Inactive Users (3+ days)**: Gentle reminder notification created
3. **Anonymous Users**: Skipped (no notifications)
4. **Quiet Hours**: No notifications sent between 10 PM - 8 AM
5. **Duplicate Prevention**: Only one inactivity notification per user
6. **Scheduled Execution**: Runs automatically every hour

## Monitoring

### Logs to Watch

```
INFO  - Starting inactivity detection job
INFO  - Found X inactive users
INFO  - Created inactivity notification for user: user@example.com
INFO  - Inactivity detection job completed. Created X notifications
```

### Database Queries

```sql
-- Check recent notifications
SELECT * FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check user activity
SELECT u.email, ua.last_active_at,
       NOW() - ua.last_active_at as days_inactive
FROM users u
LEFT JOIN user_activity ua ON u.id = ua.user_id
ORDER BY ua.last_active_at ASC;
```

## Configuration

### Inactivity Threshold

- **Current**: 3 days
- **Location**: `InactivityDetectionService.INACTIVITY_DAYS`
- **Change**: Modify the constant value

### Quiet Hours

- **Current**: 10 PM to 8 AM
- **Location**: `InactivityDetectionService.isWithinQuietHours()`
- **Change**: Modify the `quietStart` and `quietEnd` times

### Schedule Frequency

- **Current**: Every hour
- **Location**: `@Scheduled(cron = "0 0 * * * *")`
- **Change**: Modify the cron expression

## Troubleshooting

### Common Issues

1. **No notifications created**
   - Check if users are actually inactive (3+ days)
   - Verify users are not in anonymous mode
   - Check if within quiet hours
   - Ensure no existing inactivity notifications

2. **Duplicate notifications**
   - Check the `hasNotificationContaining()` method
   - Verify the notification message contains "inactive"

3. **Scheduled job not running**
   - Verify `@EnableScheduling` is present in main application class
   - Check application logs for scheduling errors

### Debug Mode

Enable debug logging in `application.yml`:

```yaml
logging:
  level:
    com.mindease.service.InactivityDetectionService: DEBUG
```
