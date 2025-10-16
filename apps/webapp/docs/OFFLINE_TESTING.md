# Offline Mode Testing Guide

## How to Test Offline Functionality

### 1. Build the Application with PWA Support

```bash
cd apps/webapp
npm run build
```

### 2. Serve the Built Application

```bash
npm run preview
# or use any static server like:
# npx serve dist
```

### 3. Test Offline Mode in Browser DevTools

#### Chrome/Edge DevTools:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Check that the service worker is registered and running
5. Go to **Network** tab
6. Check the **Offline** checkbox to simulate offline mode
7. Refresh the page

#### Firefox DevTools:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Go to **Network** tab
5. Check the **Offline** checkbox
6. Refresh the page

### 4. What to Test

#### ✅ Offline Banner

- Should see orange banner at top: "You're offline — AI summaries are disabled."
- Banner should appear when going offline
- Banner should disappear when going back online

#### ✅ Journal Functionality

- Try to add a journal entry while offline
- Should see warning: "AI summarization is unavailable offline."
- Should see info: "Journal entries will be saved locally and synced when online."
- AI status should show as unavailable

#### ✅ Mindfulness Functionality

- Should be able to view cached mindfulness sessions
- Should see info message: "Using cached mindfulness sessions. Some features may be limited offline."
- Audio and animations should work if previously cached

#### ✅ Caching Behavior

- First visit: Cache mindfulness sessions and journal history
- Go offline: Should still see cached data
- Go back online: Should sync any pending changes

### 5. Expected Behavior

#### When Online:

- All features work normally
- AI summaries are available
- Real-time data fetching
- No offline banner

#### When Offline:

- Orange offline banner appears
- AI features are disabled
- Cached data is used
- User can still interact with cached content
- Appropriate warning messages are shown

### 6. Cache Verification

#### Check Service Worker Cache:

1. DevTools → Application → Storage → Cache Storage
2. Look for these caches:
   - `mindfulness-cache` (mindfulness sessions)
   - `journal-history-cache` (journal entries)
   - `media-cache` (audio files, animations)
   - `static-assets` (JS, CSS, images)

#### Verify Cache Strategy:

- **CacheFirst**: Static assets, media files
- **NetworkFirst**: Journal history (tries network first, falls back to cache)

### 7. Troubleshooting

#### Service Worker Not Registering:

- Check browser console for errors
- Ensure HTTPS or localhost
- Clear browser cache and reload

#### Cache Not Working:

- Check Network tab for failed requests
- Verify URL patterns in vite.config.js
- Check service worker logs in DevTools

#### Offline Banner Not Showing:

- Check if OfflineBanner component is imported in Navigation
- Verify CSS is loaded
- Check browser's online/offline events

### 8. Performance Testing

#### Cache Size Limits:

- mindfulness-cache: 30 entries, 7 days
- journal-history-cache: 20 entries, 24 hours
- media-cache: 50 entries, 30 days
- static-assets: 100 entries, 30 days

#### Network Timeout:

- Journal history: 3 seconds timeout before using cache
- Other requests: Immediate cache fallback

### 9. Browser Compatibility

#### Supported Browsers:

- Chrome 60+
- Firefox 55+
- Safari 11.1+
- Edge 79+

#### Features:

- Service Worker API
- Cache API
- Fetch API
- Online/Offline events
