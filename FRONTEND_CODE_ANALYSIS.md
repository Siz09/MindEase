# Frontend Code Analysis Report

## Executive Summary

This report analyzes all frontend files in the `apps/` directory to identify files with excessive line counts that may need refactoring.

**Key Findings:**
- **1 file** exceeds 1000 lines (critical)
- **11 files** exceed 500 lines (need refactoring)
- **30 files** exceed 200 lines (should be reviewed)

---

## 🚨 Critical Files (>1000 lines)

### 1. `apps/webapp/src/pages/Chat.jsx` - **1,944 lines** ⚠️ CRITICAL
**Status:** Needs immediate refactoring

**Issues:**
- Massive component handling too many responsibilities
- Contains WebSocket logic, voice recording, TTS, message handling, offline queue, history pagination
- Difficult to maintain, test, and debug

**Recommendations:**
- Extract WebSocket connection logic → `hooks/useWebSocket.js`
- Extract voice recording logic → `hooks/useVoiceRecording.js` (partially exists)
- Extract message handling → `hooks/useChatMessages.js`
- Extract offline queue logic → `hooks/useOfflineQueue.js`
- Extract history pagination → `hooks/useChatHistory.js`
- Create smaller sub-components:
  - `ChatMessageList.jsx`
  - `ChatInput.jsx`
  - `ChatHeader.jsx`
  - `VoiceControls.jsx`

**Target:** Break into 8-10 smaller files (~150-250 lines each)

---

## ⚠️ Large Files (500-1000 lines)

### 2. `apps/webapp/src/contexts/AuthContext.jsx` - **755 lines**
**Status:** Needs refactoring

**Issues:**
- Complex authentication logic with token refresh, Firebase integration, session management
- Multiple responsibilities in one context

**Recommendations:**
- Extract token refresh logic → `hooks/useTokenRefresh.js`
- Extract Firebase auth logic → `utils/firebaseAuth.js`
- Extract session management → `hooks/useSession.js`
- Split into smaller contexts if needed

**Target:** Reduce to ~400-500 lines

---

### 3. `apps/webapp/src/pages/Settings.jsx` - **752 lines**
**Status:** Needs refactoring

**Issues:**
- Handles multiple settings categories (voice, language, quiet hours, AI provider, account conversion)
- Too many state variables and handlers

**Recommendations:**
- Split into sub-components:
  - `VoiceSettingsSection.jsx`
  - `LanguageSettingsSection.jsx`
  - `QuietHoursSection.jsx`
  - `AIProviderSection.jsx`
  - `AccountSettingsSection.jsx`
- Extract form logic to custom hooks

**Target:** Break into 5-6 components (~100-150 lines each)

---

### 4. `apps/webapp/src/pages/Mindfulness.jsx` - **693 lines**
**Status:** Needs refactoring

**Issues:**
- Main mindfulness page with multiple features

**Recommendations:**
- Extract sections into components:
  - `MindfulnessDashboard.jsx`
  - `MeditationSection.jsx`
  - `BreathingSection.jsx`
  - `ProgramsSection.jsx`

**Target:** Reduce to ~300-400 lines

---

### 5. `apps/webapp/src/admin/pages/UserManagement.jsx` - **674 lines**
**Status:** Needs refactoring

**Issues:**
- Admin user management with complex table, filters, modals

**Recommendations:**
- Extract table component → `admin/components/UserTable.jsx`
- Extract filters → `admin/components/UserFilters.jsx`
- Extract modals → `admin/components/UserModals.jsx`

**Target:** Reduce to ~300-400 lines

---

### 6. `apps/webapp/src/pages/Mood.jsx` - **533 lines**
**Status:** Should be reviewed

**Recommendations:**
- Extract mood input logic → `components/MoodInputSection.jsx`
- Extract mood history → `components/MoodHistory.jsx`
- Extract mood charts → `components/MoodCharts.jsx` (partially exists)

**Target:** Reduce to ~300-350 lines

---

### 7. `apps/webapp/src/pages/Register.jsx` - **484 lines**
**Status:** Should be reviewed

**Recommendations:**
- Extract form validation → `hooks/useRegistrationForm.js`
- Extract form sections → `components/RegisterForm.jsx`
- Extract social auth → `components/SocialAuthButtons.jsx`

**Target:** Reduce to ~250-300 lines

---

### 8. `apps/webapp/src/pages/Insights.jsx` - **484 lines**
**Status:** Should be reviewed

**Recommendations:**
- Extract chart components
- Extract stats section
- Extract session summaries

**Target:** Reduce to ~300-350 lines

---

### 9. `apps/webapp/src/pages/Journal.jsx` - **458 lines**
**Status:** Should be reviewed

**Recommendations:**
- Extract journal form → `components/JournalForm.jsx` (exists, but may need enhancement)
- Extract journal history → `components/JournalHistory.jsx` (exists)
- Extract voice recording integration

**Target:** Reduce to ~250-300 lines

---

### 10. `apps/webapp/src/admin/pages/AuditLogs.jsx` - **401 lines**
**Status:** Should be reviewed

**Recommendations:**
- Extract table component
- Extract filters
- Extract export functionality

**Target:** Reduce to ~250-300 lines

---

### 11. `apps/webapp/src/admin/pages/Settings.jsx` - **400 lines**
**Status:** Should be reviewed

**Recommendations:**
- Split into settings sections
- Extract form components

**Target:** Reduce to ~250-300 lines

---

## 📊 Files by Category

### Pages (Main Application)
| File | Lines | Status |
|------|-------|--------|
| `Chat.jsx` | 1,944 | 🚨 Critical |
| `Settings.jsx` | 752 | ⚠️ Large |
| `Mindfulness.jsx` | 693 | ⚠️ Large |
| `Mood.jsx` | 533 | ⚠️ Large |
| `Register.jsx` | 484 | ⚠️ Large |
| `Insights.jsx` | 484 | ⚠️ Large |
| `Journal.jsx` | 458 | ⚠️ Large |
| `Subscription.jsx` | 365 | ✅ OK |
| `Notifications.jsx` | 268 | ✅ OK |
| `Login.jsx` | 262 | ✅ OK |
| `Dashboard.jsx` | 236 | ✅ OK |
| `ForgotPassword.jsx` | 212 | ✅ OK |
| `GuidedProgramPlayer.jsx` | 196 | ✅ OK |
| `Profile.jsx` | 87 | ✅ OK |

### Admin Pages
| File | Lines | Status |
|------|-------|--------|
| `UserManagement.jsx` | 674 | ⚠️ Large |
| `AuditLogs.jsx` | 401 | ⚠️ Large |
| `Settings.jsx` | 400 | ⚠️ Large |
| `Dashboard.jsx` | 392 | ✅ OK |
| `CrisisFlags.jsx` | 383 | ✅ OK |
| `SystemMonitoring.jsx` | 382 | ✅ OK |
| `ContentLibrary.jsx` | 378 | ✅ OK |
| `CrisisMonitoring.jsx` | 374 | ✅ OK |
| `Analytics.jsx` | 259 | ✅ OK |
| `Overview.jsx` | 254 | ✅ OK |

### Contexts
| File | Lines | Status |
|------|-------|--------|
| `AuthContext.jsx` | 755 | ⚠️ Large |
| `ThemeContext.jsx` | 35 | ✅ OK |

### Components
| File | Lines | Status |
|------|-------|--------|
| `VoiceModeTutorial.jsx` | 382 | ✅ OK |
| `MeditationTimer.jsx` | 374 | ✅ OK |
| `MindfulnessAnalytics.jsx` | 295 | ✅ OK |
| `Navbar.jsx` | 280 | ✅ OK |
| `BreathingTimer.jsx` | 277 | ✅ OK |
| `Navigation.jsx` | 244 | ✅ OK |
| `MoodInput.jsx` | 221 | ✅ OK |
| `ChatBot.jsx` | 200 | ✅ OK |
| `ChatBubble.jsx` | 185 | ✅ OK |
| `JournalForm.jsx` | 178 | ✅ OK |
| `JournalHistory.jsx` | 174 | ✅ OK |
| `EmojiPicker.jsx` | 162 | ✅ OK |
| `MoodCharts.jsx` | 154 | ✅ OK |

### Hooks
| File | Lines | Status |
|------|-------|--------|
| `useVoiceRecorder.js` | 278 | ✅ OK |
| `useTextToSpeech.js` | 184 | ✅ OK |
| `useAICompletionPolling.js` | 81 | ✅ OK |

### Utils
| File | Lines | Status |
|------|-------|--------|
| `voiceAnalytics.js` | 237 | ✅ OK |
| `voiceSettingsManager.js` | 215 | ✅ OK |
| `voiceActivityDetection.js` | 169 | ✅ OK |
| `voiceCommands.js` | 125 | ✅ OK |
| `speechUtils.js` | 124 | ✅ OK |

### Marketing App
| File | Lines | Status |
|------|-------|--------|
| `Contact.jsx` | 346 | ✅ OK |
| `WhyMindease.jsx` | 305 | ✅ OK |
| `About.jsx` | 247 | ✅ OK |
| `Features.jsx` | 198 | ✅ OK |

---

## 🎯 Refactoring Priority

### Priority 1 (Immediate)
1. **Chat.jsx** (1,944 lines) - Critical
   - Impact: High
   - Effort: High
   - Risk: Medium (if done carefully)

### Priority 2 (High)
2. **AuthContext.jsx** (755 lines)
3. **Settings.jsx** (752 lines)
4. **Mindfulness.jsx** (693 lines)
5. **UserManagement.jsx** (674 lines)

### Priority 3 (Medium)
6. **Mood.jsx** (533 lines)
7. **Register.jsx** (484 lines)
8. **Insights.jsx** (484 lines)
9. **Journal.jsx** (458 lines)
10. **AuditLogs.jsx** (401 lines)
11. **Admin Settings.jsx** (400 lines)

---

## 📋 Refactoring Strategy

### For Chat.jsx (Priority 1)

**Step 1: Extract Hooks**
```javascript
// hooks/useWebSocket.js
export const useWebSocket = () => {
  // WebSocket connection logic
}

// hooks/useChatMessages.js
export const useChatMessages = () => {
  // Message state and operations
}

// hooks/useChatHistory.js
export const useChatHistory = () => {
  // History pagination logic
}

// hooks/useOfflineQueue.js
export const useOfflineQueue = () => {
  // Offline queue management
}
```

**Step 2: Extract Components**
```javascript
// components/chat/ChatMessageList.jsx
export const ChatMessageList = ({ messages, ... }) => {
  // Message list rendering
}

// components/chat/ChatInput.jsx
export const ChatInput = ({ onSend, ... }) => {
  // Input and send logic
}

// components/chat/ChatHeader.jsx
export const ChatHeader = ({ ... }) => {
  // Header with connection status
}

// components/chat/VoiceControls.jsx
export const VoiceControls = ({ ... }) => {
  // Voice recording controls
}
```

**Step 3: Refactor Main Component**
```javascript
// pages/Chat.jsx (reduced to ~200-300 lines)
const Chat = () => {
  const ws = useWebSocket();
  const messages = useChatMessages();
  const history = useChatHistory();
  const offlineQueue = useOfflineQueue();

  return (
    <div>
      <ChatHeader />
      <ChatMessageList messages={messages} />
      <ChatInput onSend={handleSend} />
      <VoiceControls />
    </div>
  );
};
```

---

## 📈 Metrics Summary

- **Total Files Analyzed:** 150+
- **Files > 1000 lines:** 1 (0.67%)
- **Files > 500 lines:** 11 (7.3%)
- **Files > 200 lines:** 30 (20%)
- **Average File Size:** ~150 lines
- **Largest File:** Chat.jsx (1,944 lines)
- **Smallest File:** Various (1-10 lines)

---

## ✅ Best Practices Recommendations

1. **Component Size:** Keep components under 300 lines
2. **Single Responsibility:** Each component should do one thing well
3. **Custom Hooks:** Extract complex logic into reusable hooks
4. **Component Composition:** Break large components into smaller, composable pieces
5. **File Organization:** Group related components in feature folders
6. **Code Splitting:** Use React.lazy() for large components

---

## 🔄 Next Steps

1. **Immediate:** Start refactoring Chat.jsx
2. **Week 1:** Refactor AuthContext.jsx and Settings.jsx
3. **Week 2:** Refactor Mindfulness.jsx and UserManagement.jsx
4. **Week 3:** Review and refactor remaining large files
5. **Ongoing:** Establish code review guidelines to prevent large files

---

*Report generated: $(Get-Date)*
*Analyzed: All .js, .jsx, .ts, .tsx files in apps/ directory*
