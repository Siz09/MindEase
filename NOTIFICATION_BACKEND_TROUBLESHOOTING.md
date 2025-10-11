# Notification Backend Troubleshooting Guide

## Issue: Backend Not Starting (500 Internal Server Error)

The notification system is working with mock data, but the backend is not responding. Here's how to fix it:

## Step 1: Check Database Status

The backend requires PostgreSQL to be running. Check if the database is running:

```bash
# Check if Docker containers are running
docker ps

# If not running, start the database
cd backend/docker
docker-compose up -d
```

## Step 2: Check Database Connection

Verify the database is accessible:

```bash
# Test database connection (if you have psql installed)
psql -h localhost -p 5432 -U mindease -d mindease
```

## Step 3: Fix Flyway Migration Issues

The error log shows Flyway migration issues. This is likely due to:

1. **Migration checksum mismatch** - The database has different migration checksums than the code
2. **Database schema conflicts** - Previous migrations may have failed

### Solution A: Reset Database (Recommended for Development)

```bash
# Stop the backend
# Remove the database volume
cd backend/docker
docker-compose down -v

# Start fresh database
docker-compose up -d

# Wait for database to be ready
docker-compose logs postgres
```

### Solution B: Repair Flyway (If you want to keep existing data)

````bash
# Repair Flyway schema history from the project root (keeps data intact)
./mvnw -pl backend flyway:repair

# If you must delete a specific row, first inspect flyway_schema_history to confirm the exact version before running any DELETE statement.

## Step 4: Start Backend

```bash
cd backend
./mvnw spring-boot:run
````

## Step 5: Verify Backend is Running

```bash
# Test health endpoint
curl http://localhost:8080/api/health/status

# Test notification endpoint (with authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/api/notifications/list
```

## Step 6: Test Notification System

1. **Frontend**: The notification system will automatically switch from mock data to real backend data once the backend is running
2. **Bell Icon**: Should show unread count badge
3. **Notifications Page**: Should load real notifications from backend
4. **Toast Notifications**: Should work with real-time updates

## Current Status

✅ **Frontend**: Fully implemented and working with mock data
✅ **Backend Controller**: Created and ready
❌ **Backend Service**: Not running due to database issues
❌ **Database**: Needs to be reset or repaired

## Mock Data Features

While the backend is not running, the notification system provides:

- **Mock Notifications**: Sample notifications for testing
- **Local State Management**: Mark as read functionality works locally
- **Toast Notifications**: New notification alerts
- **Responsive Design**: Works on all devices

## Next Steps

1. **Fix Database**: Follow the steps above to get the database running
2. **Start Backend**: Run the Spring Boot application
3. **Test Integration**: Verify the frontend connects to the real backend
4. **Create Test Data**: Add some real notifications to test the system

## Alternative: Continue with Mock Data

If you want to continue development without fixing the backend immediately:

- The notification system works perfectly with mock data
- All UI components are functional
- You can test the complete user experience
- The system will automatically switch to real data when the backend is available

## Database Schema

The notification system uses these tables:

```sql
-- notifications table (already exists)
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT FALSE
);

-- user_activity table (already exists)
CREATE TABLE user_activity (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    last_active_at TIMESTAMP NOT NULL
);
```

## API Endpoints

Once the backend is running, these endpoints will be available:

- `GET /api/notifications/list` - Get paginated notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/{id}/mark-read` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification

## Testing the Complete System

1. **Start Database**: `docker-compose up -d`
2. **Start Backend**: `./mvnw spring-boot:run`
3. **Start Frontend**: `npm run dev`
4. **Login**: Use existing authentication
5. **Test Notifications**: Check bell icon, notifications page, and toast alerts

The notification system is fully implemented and ready to work once the backend is running!
