# Mood Check-In Feature - Test Cases

## Overview

This document contains test cases for the Mood Check-In feature of the MindEase application. The feature allows users to record their mood on a 1-5 scale, with optional tags and association with chat sessions.

**Feature**: Mood Check-In API
**Base Endpoint**: `/api/mood/checkins`
**Authentication**: Required (Bearer Token)

---

## Test Cases Checklist

| ✓   | Test Case ID | Description                            | Endpoint                      | Method | Expected Status  | Test Data                                                                                 | Notes                                        |
| --- | ------------ | -------------------------------------- | ----------------------------- | ------ | ---------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| ☐   | TC-001       | Create standalone mood check-in        | `/api/mood/checkins`          | POST   | 201 Created      | `score: 4, tags: ["calm", "focused"], checkinType: "standalone"`                          | Valid standalone check-in without session    |
| ☐   | TC-002       | Create pre-chat mood check-in          | `/api/mood/checkins`          | POST   | 201 Created      | `score: 3, tags: ["anxious", "stressed"], checkinType: "pre_chat", sessionId: <uuid>`     | Requires valid session ID                    |
| ☐   | TC-003       | Create post-chat mood check-in         | `/api/mood/checkins`          | POST   | 201 Created      | `score: 5, tags: ["relieved", "understood"], checkinType: "post_chat", sessionId: <uuid>` | Requires valid session ID                    |
| ☐   | TC-004       | Invalid score (below minimum)          | `/api/mood/checkins`          | POST   | 400 Bad Request  | `score: 0, checkinType: "standalone"`                                                     | Score must be 1-5                            |
| ☐   | TC-005       | Invalid score (above maximum)          | `/api/mood/checkins`          | POST   | 400 Bad Request  | `score: 6, checkinType: "standalone"`                                                     | Score must be 1-5                            |
| ☐   | TC-006       | Invalid check-in type                  | `/api/mood/checkins`          | POST   | 400 Bad Request  | `score: 3, checkinType: "invalid_type"`                                                   | Type must be pre_chat/post_chat/standalone   |
| ☐   | TC-007       | Missing required fields                | `/api/mood/checkins`          | POST   | 400 Bad Request  | `tags: ["happy"]` (no score/checkinType)                                                  | Validation error for missing fields          |
| ☐   | TC-008       | Get recent check-ins (default 30 days) | `/api/mood/checkins`          | GET    | 200 OK           | None                                                                                      | Returns array of check-ins from last 30 days |
| ☐   | TC-009       | Get recent check-ins (custom period)   | `/api/mood/checkins?days=7`   | GET    | 200 OK           | Query param: `days=7`                                                                     | Returns check-ins from last 7 days           |
| ☐   | TC-010       | Invalid days parameter                 | `/api/mood/checkins?days=500` | GET    | 400 Bad Request  | Query param: `days=500`                                                                   | Days must be 1-365                           |
| ☐   | TC-011       | Get latest check-in                    | `/api/mood/checkins/latest`   | GET    | 200 OK           | None                                                                                      | Returns most recent check-in object          |
| ☐   | TC-012       | Get latest (no previous check-ins)     | `/api/mood/checkins/latest`   | GET    | 200 OK (null)    | None                                                                                      | Returns null when no check-ins exist         |
| ☐   | TC-013       | Unauthorized access                    | `/api/mood/checkins`          | POST   | 401 Unauthorized | No auth header                                                                            | Authentication required                      |
| ☐   | TC-014       | Session ownership validation           | `/api/mood/checkins`          | POST   | 403 Forbidden    | `sessionId: <other-user-session>`                                                         | Cannot use another user's session            |

---

## Detailed Test Case Information

### TC-001: Create Standalone Mood Check-In

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "score": 4,
  "tags": ["calm", "focused"],
  "checkinType": "standalone",
  "sessionId": null
}
```

**Expected Response:**

```json
Status: 201 Created
{
  "id": "<uuid>",
  "score": 4,
  "tags": ["calm", "focused"],
  "checkinType": "standalone",
  "sessionId": null,
  "createdAt": "<timestamp>"
}
```

---

### TC-002: Create Pre-Chat Mood Check-In

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "score": 3,
  "tags": ["anxious", "stressed"],
  "checkinType": "pre_chat",
  "sessionId": "<session-uuid>"
}
```

**Expected Response:**

```json
Status: 201 Created
{
  "id": "<uuid>",
  "score": 3,
  "tags": ["anxious", "stressed"],
  "checkinType": "pre_chat",
  "sessionId": "<session-uuid>",
  "createdAt": "<timestamp>"
}
```

---

### TC-003: Create Post-Chat Mood Check-In

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "score": 5,
  "tags": ["relieved", "understood"],
  "checkinType": "post_chat",
  "sessionId": "<session-uuid>"
}
```

**Expected Response:**

```json
Status: 201 Created
{
  "id": "<uuid>",
  "score": 5,
  "tags": ["relieved", "understood"],
  "checkinType": "post_chat",
  "sessionId": "<session-uuid>",
  "createdAt": "<timestamp>"
}
```

---

### TC-004: Invalid Score (Below Minimum)

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "score": 0,
  "tags": [],
  "checkinType": "standalone"
}
```

**Expected Response:**

```
Status: 400 Bad Request
Validation error: Score must be between 1 and 5
```

---

### TC-005: Invalid Score (Above Maximum)

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "score": 6,
  "tags": [],
  "checkinType": "standalone"
}
```

**Expected Response:**

```
Status: 400 Bad Request
Validation error: Score must be between 1 and 5
```

---

### TC-006: Invalid Check-In Type

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "score": 3,
  "tags": [],
  "checkinType": "invalid_type"
}
```

**Expected Response:**

```
Status: 400 Bad Request
Validation error: Check-in type must be one of: pre_chat, post_chat, standalone
```

---

### TC-007: Missing Required Fields

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "tags": ["happy"]
}
```

**Expected Response:**

```
Status: 400 Bad Request
Validation errors for missing required fields (score, checkinType)
```

---

### TC-008: Get Recent Check-Ins (Default Period)

**Request:**

```
GET /api/mood/checkins
Authorization: Bearer <token>
```

**Expected Response:**

```json
Status: 200 OK
[
  {
    "id": "<uuid>",
    "score": 4,
    "tags": ["calm"],
    "checkinType": "standalone",
    "sessionId": null,
    "createdAt": "<timestamp>"
  },
  ...
]
```

---

### TC-009: Get Recent Check-Ins (Custom Period)

**Request:**

```
GET /api/mood/checkins?days=7
Authorization: Bearer <token>
```

**Expected Response:**

```json
Status: 200 OK
Array of mood check-in objects from the last 7 days
```

---

### TC-010: Invalid Days Parameter

**Request:**

```
GET /api/mood/checkins?days=500
Authorization: Bearer <token>
```

**Expected Response:**

```
Status: 400 Bad Request
Error: Days must be between 1 and 365
```

---

### TC-011: Get Latest Check-In

**Request:**

```
GET /api/mood/checkins/latest
Authorization: Bearer <token>
```

**Expected Response:**

```json
Status: 200 OK
{
  "id": "<uuid>",
  "score": 4,
  "tags": ["calm"],
  "checkinType": "standalone",
  "sessionId": null,
  "createdAt": "<timestamp>"
}
```

---

### TC-012: Get Latest (No Previous Check-Ins)

**Request:**

```
GET /api/mood/checkins/latest
Authorization: Bearer <token>
```

**Expected Response:**

```json
Status: 200 OK
null
```

---

### TC-013: Unauthorized Access

**Request:**

```json
POST /api/mood/checkins
(No Authorization header)
{
  "score": 3,
  "checkinType": "standalone"
}
```

**Expected Response:**

```
Status: 401 Unauthorized
Authentication error message
```

---

### TC-014: Session Ownership Validation

**Request:**

```json
POST /api/mood/checkins
Authorization: Bearer <token>
{
  "score": 3,
  "checkinType": "pre_chat",
  "sessionId": "<other-user-session-uuid>"
}
```

**Expected Response:**

```
Status: 403 Forbidden
Error: Session does not belong to user
```

---

## Test Summary

### Endpoints Tested

- `POST /api/mood/checkins` - Create mood check-in
- `GET /api/mood/checkins` - Get recent check-ins
- `GET /api/mood/checkins/latest` - Get latest check-in

### Test Coverage

- ✅ Valid check-in creation (all types: standalone, pre_chat, post_chat)
- ✅ Score validation (range 1-5)
- ✅ Check-in type validation
- ✅ Required field validation
- ✅ Retrieval operations (recent, latest)
- ✅ Parameter validation (days parameter)
- ✅ Authentication and authorization
- ✅ Session ownership validation

### Test Execution Notes

- All tests require valid authentication tokens
- Tests should be executed in a test environment with sample data
- Consider cleanup between test runs to ensure isolation
- Session IDs should be valid UUIDs when provided
- Use checkboxes (☐) to mark completed tests, replace with (✓) when passed
