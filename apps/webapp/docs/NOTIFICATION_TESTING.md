# Notification System Testing Guide

## Overview

This guide explains how to test the in-app notification system that has been implemented in MindEase.

## Features Implemented

### Frontend Components

1. **NotificationBell Component** (`/src/components/NotificationBell.jsx`)
   - Bell icon with unread count badge
   - Click to navigate to notifications page
   - Shows toast notifications for new messages

2. **Notifications Page** (`/src/pages/Notifications.jsx`)
   - Paginated list of notifications
   - Mark individual notifications as read
   - Mark all notifications as read
   - Refresh functionality
   - Empty state handling

3. **useNotifications Hook** (`/src/hooks/useNotifications.js`)
   - Polls for notifications every 15 seconds
   - Handles unread count
   - Provides CRUD operations for notifications

### Backend Components

1. **NotificationController** (`/backend/src/main/java/com/mindease/controller/NotificationController.java`)
   - GET `/api/notifications/list` - Get paginated notifications
   - GET `/api/notifications/unread-count` - Get unread count
   - PATCH `/api/notifications/{id}/mark-read` - Mark notification as read
   - PATCH `/api/notifications/mark-all-read` - Mark all as read
   - DELETE `/api/notifications/{id}` - Delete notification

## Testing Steps

### 1. Start the Application

**Option A: With Backend (Full Functionality)**

```bash
# Start database
cd backend/docker
docker-compose up -d

# Start backend
cd backend
./mvnw spring-boot:run

# Start frontend
cd apps/webapp
npm run dev
```

**Option B: Frontend Only (Mock Data)**

```bash
# Start frontend only
cd apps/webapp
npm run dev
```

> **Note**: If the backend is not running, the notification system will automatically use mock data for testing.

### 2. Test Notification Bell

1. Login to the application
2. Look for the bell icon in the navigation bar
3. The bell should show an unread count badge if there are unread notifications
4. Click the bell to navigate to the notifications page

### 3. Test Notifications Page

1. Navigate to `/notifications` or click the bell icon
2. Verify the page loads with proper styling
3. Check if notifications are displayed correctly
4. Test the "Mark as Read" functionality
5. Test the "Mark All Read" button
6. Test the refresh button

### 4. Test Toast Notifications

1. Create a new notification (via backend or database)
2. Wait for the polling to detect the new notification
3. Verify a toast notification appears in the top-right corner

### 5. Test Polling

1. Open browser developer tools
2. Go to Network tab
3. Verify that requests to `/api/notifications/list` are made every 15 seconds

## Mock Data Testing

If the backend endpoints are not yet available, the system includes mock data:

```javascript
// In useNotifications.js, mock data is provided when 404 error occurs
const mockNotifications = [
  {
    id: '1',
    type: 'IN_APP',
    message: 'Welcome to MindEase! Start tracking your mood today.',
    createdAt: new Date().toISOString(),
    isSent: false,
  },
];
```

## Expected Behavior

### Notification Bell

- Shows bell icon in navigation
- Displays red badge with unread count when there are unread notifications
- Badge disappears when all notifications are read
- Clicking navigates to notifications page

### Notifications Page

- Shows list of notifications with proper styling
- Unread notifications have blue left border and lighter background
- Read notifications appear dimmed
- Mark as read buttons only appear on unread notifications
- Empty state shows when no notifications exist

### Toast Notifications

- Appear in top-right corner for new notifications
- Auto-dismiss after 5 seconds
- Show notification message content

## Troubleshooting

### Common Issues

1. **Bell icon not showing**
   - Check if user is logged in
   - Verify NotificationBell is imported in Navigation.jsx

2. **Notifications not loading**
   - Check browser console for API errors
   - Verify backend is running
   - Check if JWT token is valid

3. **Toast notifications not appearing**
   - Verify React Toastify is configured in App.jsx
   - Check if ToastContainer is rendered

4. **Polling not working**
   - Check browser Network tab for periodic requests
   - Verify useNotifications hook is being used

### Browser Console Commands

```javascript
// Check if notifications hook is working
console.log('Notifications:', window.notifications);

// Manually trigger notification fetch
// (if useNotifications is available in global scope)
```

## API Endpoints

### Get Notifications

```
GET /api/notifications/list?page=0&size=20
Authorization: Bearer <jwt-token>
```

### Get Unread Count

```
GET /api/notifications/unread-count
Authorization: Bearer <jwt-token>
```

### Mark as Read

```
PATCH /api/notifications/{id}/mark-read
Authorization: Bearer <jwt-token>
```

### Mark All as Read

```
PATCH /api/notifications/mark-all-read
Authorization: Bearer <jwt-token>
```

## Future Enhancements

1. **Real-time Notifications**
   - WebSocket integration for instant notifications
   - Push notifications for mobile

2. **Notification Types**
   - Different icons for different notification types
   - Priority levels

3. **Advanced Features**
   - Notification filtering
   - Notification search
   - Bulk operations

4. **Mobile Optimization**
   - Swipe gestures
   - Mobile-specific layouts
