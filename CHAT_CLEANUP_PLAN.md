# Chat.jsx Cleanup Plan

**Current State:** 1,229 lines
**Target:** 200-250 lines
**Goal:** Remove unused code, utilize extracted components, simplify orchestration

---

## Phase 1: Remove Unused Imports (Quick Win - ~15 min)

### Unused Imports to Remove:

- `cn` from `lib/utils` - not used
- `requestMicrophonePermission` - handled in hook
- `detectVoiceCommand`, `isVoiceCommand` - handled in hook
- `trackVoiceModeStarted`, `trackVoiceModeStopped`, `trackRecordingStarted`, `trackRecordingCompleted`, `trackTranscriptionComplete`, `trackTTSCompleted`, `trackTTSError`, `trackVoiceCommand`, `trackPermissionDenied` - only `trackRecordingError` and `trackTTSStarted` are used
- `LRUCache` - not directly used (handled in hook)
- `Input` component - not used (using inline textarea)
- `MESSAGE_STATUS`, `getStatusIcon`, `getStatusColor`, `getStatusText` - used in ChatMessageList component, not needed here

**Expected reduction:** ~40 lines

---

## Phase 2: Replace Inline UI with shadcn/ui Components (Medium - ~45 min)

### 2.1 Replace Input Section with shadcn/ui (lines ~1200-1294)

**Current:** Inline form with textarea, buttons, and voice toggle
**Action:** Use shadcn/ui components via MCP:

- `textarea` - for message input
- `button` - for send and voice toggle buttons
- `badge` - for interim transcript indicator

**Steps:**

1. Get shadcn/ui `textarea` component via MCP
2. Get shadcn/ui `button` component via MCP
3. Refactor inline input section to use shadcn/ui components
4. Maintain all existing functionality (interim transcript, voice toggle, etc.)

**Props to maintain:**

- `value={inputValue}`
- `onChange={handleInputChange}`
- `onSend={sendMessage}`
- `disabled={!wsConnected || isTranscribing}`
- `onToggleVoiceConversation={toggleVoiceConversation}`
- `showVoiceConversationToggle={isVoiceConversationMode}`
- `voiceConversationActive={isVoiceConversationActive}`
- `interimTranscript` display

**Expected reduction:** ~95 lines

### 2.2 Replace Message List Section with shadcn/ui (lines ~850-1100)

**Current:** Inline message rendering with ChatBubble
**Action:** Use shadcn/ui components via MCP:

- `scroll-area` - for message container with proper scrolling
- `spinner` - for loading history indicator
- `empty` - for empty state (or keep custom empty state if more feature-rich)
- `badge` - for status indicators
- `button` - for load older messages button

**Steps:**

1. Get shadcn/ui `scroll-area` component via MCP
2. Get shadcn/ui `spinner` component via MCP
3. Get shadcn/ui `empty` component via MCP (optional, evaluate if it fits)
4. Refactor message list section to use shadcn/ui components
5. Keep existing `ChatBubble` component (or evaluate if shadcn/ui `card` would be better)

**Props to maintain:**

- `messages={messages}`
- `messageStatuses={messageStatuses}`
- `isTyping={isTyping}`
- `voiceEnabled={voiceOutputEnabled && isTTSSupported}`
- `onRetryMessage={handleRetry}`
- `onPlayVoice={handlePlayMessage}`
- `onPauseVoice={pauseSpeech}`
- `onStopVoice={handleStopMessage}`
- `isPlayingMessageId={currentPlayingMessageId}`
- `isPaused={isPaused}`
- `hasMoreHistory={hasMoreHistory}`
- `loadingHistory={loadingHistory}`
- `onLoadOlder={loadOlderHistory}`
- `containerRef={messagesContainerRef}`
- `onScroll={handleScroll}`

**Expected reduction:** ~250 lines

### 2.3 Replace Status Indicators with shadcn/ui (lines ~856-1001)

**Current:** Inline styled divs for connection, offline, and voice mode indicators
**Action:** Use shadcn/ui components via MCP:

- `alert` - for connection status and offline indicators
- `badge` - for voice mode indicator and queue count

**Steps:**

1. Get shadcn/ui `alert` component via MCP
2. Get shadcn/ui `badge` component via MCP
3. Replace inline status indicators with shadcn/ui components
4. Maintain all visual states (reconnecting, disconnected, offline, voice active)

**Expected reduction:** ~50 lines

### 2.4 Move Helper Functions to Utilities

**Functions to extract:**

- `formatTime` → `utils/chat/formatTime.js` (if used elsewhere) or keep inline if only used here
- `renderRiskLabel`, `renderModerationNote`, `renderCrisisResources` → Move to `ChatBubble` component or create `MessageModeration.jsx` component

**Expected reduction:** ~50 lines

---

## Phase 3: Simplify State & Refs (Low Priority - ~20 min)

### 3.1 Review Unused State/Refs

Check if these are actually needed:

- `userCancelledRecordingRef` - check if used
- `manuallyStoppedTTSRef` - check if used
- `retryCountRef` - check if used
- `ttsStateRef` - check if used
- `ttsVolumeRef` - check if used (may be needed for ducking)
- `messageQueueRef` - check if used

**Action:** Remove if not used, or document why they're needed

**Expected reduction:** ~10-30 lines

### 3.2 Consolidate Voice Settings State

**Current:** Multiple useState calls for voice settings
**Action:** Consider using `useVoiceSettings` hook if available, or keep as-is if simple enough

---

## Phase 4: Final Cleanup (Quick - ~10 min)

### 4.1 Remove Commented/Dead Code

- Remove any commented-out code
- Remove placeholder comments like "// handleToggleVoiceConversation is now..."

### 4.2 Simplify Callbacks

- Review if all `useCallback` hooks are necessary
- Remove if dependencies are stable and re-renders aren't an issue

### 4.3 Organize Imports

- Group imports: React, hooks, components, utils, styles
- Remove any duplicate imports

---

## Implementation Order

1. **Phase 1** (15 min) - Quick wins, no risk
2. **Phase 2.1** (20 min) - Replace input with shadcn/ui, test thoroughly
3. **Phase 2.2** (20 min) - Replace message list with shadcn/ui, test thoroughly
4. **Phase 2.3** (15 min) - Replace status indicators with shadcn/ui
5. **Phase 2.4** (15 min) - Extract helpers if needed
6. **Phase 3** (20 min) - Clean up state (optional, can skip if risky)
7. **Phase 4** (10 min) - Final polish

**Total estimated time:** ~115 minutes

## shadcn/ui Components to Install

Use MCP to get these components:

- `textarea` - Message input field
- `button` - Send and voice toggle buttons
- `scroll-area` - Message container
- `spinner` - Loading indicators
- `alert` - Connection/offline status indicators
- `badge` - Status badges and queue counts
- `empty` - Empty state (optional, evaluate first)

**Installation:** Use `mcp_shadcn-ui_get_component` MCP tool for each component

---

## Success Criteria

- ✅ Chat.jsx reduced to 200-250 lines
- ✅ All functionality preserved
- ✅ No unused imports
- ✅ Components properly utilized
- ✅ Code passes linting
- ✅ Manual testing confirms all features work

---

## Notes

- **Don't over-engineer:** If a small inline function is clearer than extracting it, keep it inline
- **Test incrementally:** Test after each phase to catch issues early
- **Preserve functionality:** Voice conversation, message sending, history loading, etc. must all work
- **Keep it simple:** The goal is cleanup, not architectural changes

---

## Risk Assessment

**Low Risk:**

- Phase 1 (imports) - No functional changes
- Phase 4 (cleanup) - Cosmetic only

**Medium Risk:**

- Phase 2 (shadcn/ui component replacement) - Requires:
  - Installing shadcn/ui components via MCP
  - Ensuring styling matches existing design system
  - Testing all interactions (voice toggle, sending, scrolling)
  - May need to customize shadcn/ui components to match current behavior
- Phase 3 (state cleanup) - Need to verify refs are truly unused

**Mitigation:**

- Test after each phase
- Keep git commits small and reversible
- Test voice conversation thoroughly (most complex feature)
