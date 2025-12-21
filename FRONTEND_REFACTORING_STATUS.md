# Frontend Refactoring Status

Last updated: 2025-12-21

This file tracks the refactoring work based on `FRONTEND_CODE_ANALYSIS.md` and the task list you provided.

## ✅ Completed

### Chat (Priority 1)
- [x] Extract WebSocket connection logic into `apps/webapp/src/hooks/useWebSocket.js`
- [x] Extract message state management into `apps/webapp/src/hooks/useChatMessages.js`
- [x] Extract history pagination into `apps/webapp/src/hooks/useChatHistory.js`
- [x] Extract offline queue management into `apps/webapp/src/hooks/useOfflineQueue.js`
- [x] Extract voice conversation logic into `apps/webapp/src/hooks/useVoiceConversation.js`
- [x] Extract chat utilities:
  - `apps/webapp/src/utils/chat/messageNormalizer.js`
  - `apps/webapp/src/utils/chat/scrollManager.js`
- [x] Extract chat UI components into `apps/webapp/src/components/chat/`:
  - `ChatHeader.jsx`, `ChatMessageList.jsx`, `ChatInput.jsx`, `ChatEmptyState.jsx`, `VoiceControls.jsx`, `TypingIndicator.jsx`
- [x] Restore/refactor main chat page `apps/webapp/src/pages/Chat.jsx` to orchestrate hooks/components

Notes:
- `apps/webapp/src/pages/Chat.jsx` is now ~326 lines (improved drastically vs 1,944, but still above the 200–250 target).

### Auth (Priority 2)
- [x] Extract token utilities to `apps/webapp/src/utils/auth/tokenUtils.js`
- [x] Extract Firebase auth operations to `apps/webapp/src/utils/auth/firebaseAuth.js`
- [x] Extract backend auth API calls to `apps/webapp/src/utils/auth/authApi.js`
- [x] Extract token refresh logic to `apps/webapp/src/hooks/useTokenRefresh.js`
- [x] Extract session/toast gating logic to `apps/webapp/src/hooks/useSession.js`
- [x] Refactor `apps/webapp/src/contexts/AuthContext.jsx` to compose extracted hooks/utils
- [x] (Supporting) Extract auth action methods into `apps/webapp/src/hooks/useAuthActions.js`

### Settings (Priority 2)
- [x] Extract settings hooks:
  - `apps/webapp/src/hooks/useVoiceSettings.js`
  - `apps/webapp/src/hooks/useQuietHours.js`
- [x] Extract settings sections into `apps/webapp/src/components/settings/`:
  - `AccountSettingsSection.jsx`
  - `LanguageSettingsSection.jsx`
  - `QuietHoursSection.jsx`
  - `AIProviderSection.jsx`
  - `VoiceSettingsSection.jsx`
- [x] Refactor `apps/webapp/src/pages/Settings.jsx` to compose sections (now ~55 lines)

### Mindfulness (Priority 2)
- [x] Extract mindfulness sections:
  - `apps/webapp/src/components/mindfulness/MindfulnessDashboard.jsx`
  - `apps/webapp/src/components/mindfulness/BreathingSection.jsx`
  - `apps/webapp/src/components/mindfulness/MeditationSection.jsx`
  - `apps/webapp/src/components/mindfulness/ProgramsSection.jsx`
- [x] (Supporting) Split discover UI into smaller components:
  - `apps/webapp/src/components/mindfulness/MindfulnessQuickStats.jsx`
  - `apps/webapp/src/components/mindfulness/MindfulnessSessionFilters.jsx`
  - `apps/webapp/src/components/mindfulness/MindfulnessSessionsGrid.jsx`
  - `apps/webapp/src/components/mindfulness/MindfulnessSessionCard.jsx`
- [x] Refactor `apps/webapp/src/pages/Mindfulness.jsx` to compose sections (now ~100–150 lines)

### Admin: User Management (Priority 2)
- [x] Extract hooks:
  - `apps/webapp/src/admin/hooks/useUsers.js`
  - `apps/webapp/src/admin/hooks/useUserFilters.js`
- [x] Extract components into `apps/webapp/src/admin/components/users/`:
  - `UserTable.jsx`, `UserFilters.jsx`, `UserActions.jsx`, `UserModals.jsx`, `UserStats.jsx`, `UserNotification.jsx`
- [x] Refactor `apps/webapp/src/admin/pages/UserManagement.jsx` to orchestrate hooks/components

### Mood (Medium priority)
- [x] Refactor `apps/webapp/src/pages/Mood.jsx` to compose existing/extracted components (~145 lines)
- [x] (Supporting) Add mood components:
  - `apps/webapp/src/components/MoodHistory.jsx`
  - `apps/webapp/src/components/MoodWellnessTips.jsx`

### Register (Medium priority)
- [x] Extract register UI into:
  - `apps/webapp/src/components/RegisterWelcome.jsx`
  - `apps/webapp/src/components/RegisterForm.jsx`
- [x] Refactor `apps/webapp/src/pages/Register.jsx` to orchestrate components (~20 lines)

### Insights (Medium priority)
- [x] Extract hooks:
  - `apps/webapp/src/hooks/useMoodInsights.js`
  - `apps/webapp/src/hooks/useJournalInsights.js`
- [x] Extract components:
  - `apps/webapp/src/components/InsightsStatsCard.jsx`
  - `apps/webapp/src/components/InsightsDailySummariesCard.jsx`
  - `apps/webapp/src/components/InsightsJournalEntriesCard.jsx`
- [x] Refactor `apps/webapp/src/pages/Insights.jsx` to orchestrate hooks/components (~99 lines)

### Journal (Medium priority)
- [x] Extract hooks:
  - `apps/webapp/src/hooks/useJournalEntries.js`
  - `apps/webapp/src/hooks/useJournalAIStatus.js`
- [x] Extract page form component:
  - `apps/webapp/src/components/JournalEntryComposer.jsx`
- [x] Extend `apps/webapp/src/components/JournalHistory.jsx` to optionally show AI summary + mood insight
- [x] Refactor `apps/webapp/src/pages/Journal.jsx` to orchestrate hooks/components (~104 lines)

### Admin: Audit Logs (Medium priority)
- [x] Extract hook: `apps/webapp/src/admin/hooks/useAuditLogs.js`
- [x] Extract components into `apps/webapp/src/admin/components/audit/`:
  - `AuditLogFilters.jsx`, `AuditLogsTable.jsx`, `AuditLogsPagination.jsx`
- [x] Refactor `apps/webapp/src/admin/pages/AuditLogs.jsx` to orchestrate hook/components (~66 lines)

### Admin: Settings (Medium priority)
- [x] Extract hook: `apps/webapp/src/admin/hooks/useAdminSettings.js`
- [x] Extract components into `apps/webapp/src/admin/components/settings/`:
  - `CrisisThresholdCard.jsx`, `AutoArchiveCard.jsx`, `EmailNotificationsCard.jsx`, `DailyReportTimeCard.jsx`
  - `AdminSettingsNotification.jsx`, `AdminSettingsActions.jsx`
- [x] Refactor `apps/webapp/src/admin/pages/Settings.jsx` to orchestrate hook/components (~73 lines)

## ⏳ Remaining

### Medium priority (Week 3–4)
- (none)
## 🧪 Validation

- Local JS build/lint/test were **not run** in this environment because `node`/`npm` tooling isn’t available here.
- When resuming, recommended checks:
  - `npm run -w @mindease/webapp lint`
  - `npm run -w @mindease/webapp build`
