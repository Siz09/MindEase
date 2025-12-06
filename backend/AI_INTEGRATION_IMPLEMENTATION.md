# AI Integration Implementation Summary

## Overview

This document summarizes the backend changes made to support the enhanced AI risk prediction model with behavioral data.

## Changes Implemented

### 1. Database Schema Updates (Migration V41)

**File:** `src/main/resources/db/migration/V41__add_behavioral_fields_for_ai_risk_model.sql`

Added 4 new columns to the `users` table:

- `days_indoors` VARCHAR(50) - Duration of stay at home
- `changes_habits` VARCHAR(10) - Significant habit changes
- `work_interest` VARCHAR(10) - Interest in work/study
- `social_weakness` VARCHAR(10) - Difficulty interacting socially

**To apply migration:** Restart the Spring Boot application. Flyway will automatically run the migration.

### 2. User Model Updates

**File:** `src/main/java/com/mindease/model/User.java`

Added new fields with getters and setters:

```java
private String daysIndoors;
private String changesHabits;
private String workInterest;
private String socialWeakness;
```

### 3. AI Service Integration

**File:** `src/main/java/com/mindease/service/LocalAIChatBotService.java`

Updated `buildUserProfile()` method to include the new behavioral fields in the profile map sent to the AI service. The AI will automatically use the enhanced Random Forest model (~98% accuracy) when these fields are present, otherwise falls back to the old Logistic Regression model (~75% accuracy).

### 4. API Endpoints Updates

**File:** `src/main/java/com/mindease/controller/UserController.java`

#### GET /api/user/profile

Now returns additional fields:

```json
{
  "status": "success",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "anonymousMode": false,

    // Demographic fields
    "age": 22,
    "gender": "Female",
    "course": "Engineering",
    "year": "3rd Year",
    "cgpa": 3.5,
    "maritalStatus": "Single",

    // NEW: Behavioral fields for enhanced AI
    "daysIndoors": "15-30 days",
    "changesHabits": "Yes",
    "workInterest": "No",
    "socialWeakness": "Yes"
  }
}
```

#### PUT/PATCH /api/user/profile

Now accepts the new behavioral fields in the request body:

```json
{
  "daysIndoors": "15-30 days",
  "changesHabits": "Yes",
  "workInterest": "No",
  "socialWeakness": "Yes"
}
```

## Frontend Integration Requirements

### 1. User Profile Form

Add input fields for the new behavioral data:

**Days Indoors** (Dropdown/Select):

- "1-14 days"
- "15-30 days"
- "31-60 days"
- "More than 2 months"
- "Go out Every day"

**Changes in Habits** (Radio/Toggle):

- "Yes"
- "No"

**Interest in Work/Study** (Radio/Toggle):

- "Yes"
- "No"
- "Maybe"

**Social Interaction Difficulty** (Radio/Toggle):

- "Yes"
- "No"
- "Maybe"

### 2. API Integration Example

#### Fetching User Profile

```typescript
const response = await fetch('/api/user/profile', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
// Access: data.user.daysIndoors, data.user.changesHabits, etc.
```

#### Updating User Profile

```typescript
const response = await fetch('/api/user/profile', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    daysIndoors: '15-30 days',
    changesHabits: 'Yes',
    workInterest: 'No',
    socialWeakness: 'Yes',
  }),
});
```

### 3. UI/UX Recommendations

1. **Onboarding Flow**: Add a step to collect behavioral data during user registration
2. **Profile Settings**: Add a "Mental Health Assessment" section
3. **Privacy Notice**: Inform users that this data improves AI accuracy (98% vs 75%)
4. **Optional Fields**: Make these fields optional but encourage completion with a progress indicator
5. **Help Text**: Add tooltips explaining what each field means

### 4. Localization Keys to Add

Add to `apps/webapp/src/locales/en/common.json`:

```json
{
  "profile": {
    "behavioralData": "Behavioral Assessment",
    "behavioralDataDescription": "Help us provide better support by sharing these details",
    "daysIndoors": "How often do you go out?",
    "changesHabits": "Have you noticed significant changes in your habits?",
    "workInterest": "Do you feel interested in your work or studies?",
    "socialWeakness": "Do you find it difficult to interact with others?",
    "accuracyImprovement": "Providing this information improves AI accuracy to 98%"
  }
}
```

## Testing Checklist

### Backend Testing

- [ ] Database migration runs successfully
- [ ] User model saves new fields correctly
- [ ] GET /api/user/profile returns new fields
- [ ] PATCH /api/user/profile updates new fields
- [ ] AI chat includes behavioral data in profile
- [ ] AI returns higher accuracy risk_score when behavioral data is present

### Frontend Testing

- [ ] Profile form displays new fields
- [ ] User can update behavioral fields
- [ ] Updated values persist after page refresh
- [ ] Field validation works correctly
- [ ] Help text/tooltips display properly

## Migration Steps

1. **Backend**:
   - Pull latest code
   - Restart Spring Boot application (migration runs automatically)
   - Verify logs: `Migrating schema to version V41`

2. **Frontend**:
   - Update API integration to handle new fields
   - Add UI components for behavioral data collection
   - Update localization files
   - Test profile update flow

3. **AI Service**:
   - Ensure your local AI service is updated with the new model
   - Test that behavioral data triggers the Random Forest model

## Benefits

✅ **98% accuracy** (up from 75%) for mental health risk prediction
✅ More personalized AI responses based on behavioral patterns
✅ Better crisis detection and intervention
✅ Enhanced RAG with mental health statistics
✅ Backward compatible (falls back to old model if data not provided)

## Support

If you encounter any issues:

1. Check backend logs for migration errors
2. Verify field names match exactly (case-sensitive)
3. Ensure AI service is updated and running
4. Test with curl/Postman before frontend integration

---

**Implementation Date:** December 5, 2025
**Version:** Backend v1.41.0
**AI Model:** Random Forest Classifier (Behavioral Data)
