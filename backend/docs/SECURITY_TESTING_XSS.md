# XSS (Cross-Site Scripting) Testing Plan

## 1. Goals

- Verify that user-controlled content cannot inject HTML/JS into the UI.
- Ensure both backend responses and frontend rendering are safe.
- Provide a repeatable XSS testing checklist for manual and automated tools.

## 2. Target Surfaces

### 2.1 Chat System

- Chat input (user messages)
- AI responses rendered in the chat history

### 2.2 Journal System

- Journal entry content (user text)
- Journal titles
- AI summaries and mood insights

### 2.3 Admin Interfaces

- Admin user search/filter inputs
- Crisis monitoring views showing user messages
- Audit logs and analytics pages that display user-generated data

## 3. Manual XSS Test Payloads

Use the following payloads in all relevant text inputs:

```text
<script>alert('xss')</script>
"\><script>alert('xss')</script>
<img src=x onerror=alert('xss')>
<a href="javascript:alert('xss')">click</a>
&lt;script&gt;alert('xss')&lt;/script&gt;
```

**Expected behavior**:

- No JavaScript should execute.
- Content should be rendered as plain text (escaped), or filtered out.
- No 500 errors or HTML parsing errors.

## 4. Automated Testing

### 4.1 OWASP ZAP

1. Start the backend and frontend in a test environment.
2. Configure ZAP to proxy browser traffic.
3. Spider the application.
4. Run the **Active Scan** focusing on XSS rules.
5. Review alerts and verify whether:
   - Any reflected or stored XSS is reported.
   - Any parameters are vulnerable to script injection.

### 4.2 Burp Suite

1. Use the **Proxy** to capture requests.
2. Send suspicious endpoints to **Intruder** or **Repeater**.
3. Inject XSS payloads into text parameters.
4. Inspect responses and the rendered UI.

## 5. Frontend Hardening Checklist

- [ ] Confirm that all user-generated content is rendered via React (no `dangerouslySetInnerHTML`).
- [ ] If `dangerouslySetInnerHTML` is used anywhere, ensure DOMPurify (or similar) sanitization is applied.
- [ ] Confirm toast messages and notifications escape user-controlled strings.
- [ ] Confirm admin tables/lists render data via JSX expressions (e.g., `{value}`) without HTML injection.

## 6. Backend Hardening Checklist

- [ ] Ensure API responses do not include raw HTML from user input.
- [ ] Ensure error messages do not echo unescaped user-provided strings.
- [ ] Consider adding a server-side HTML escaping utility for any rich-text fields.

## 7. Results Tracking

Use this table to track testing status:

| Area         | Tested (Y/N) | Issues Found | Notes |
| ------------ | ------------ | ------------ | ----- |
| Chat input   |              |              |       |
| Chat history |              |              |       |
| Journal form |              |              |       |
| Journal view |              |              |       |
| Admin pages  |              |              |       |

## 8. Conclusion

At this stage, the backend does not generate HTML from user content, and the React frontend normally escapes content by default. Real XSS risk primarily comes from:

- Any use of `dangerouslySetInnerHTML` (none currently identified), or
- Third-party libraries/components rendering raw HTML.

Run the manual and automated tests above before production to confirm no XSS vectors are present.

{
"cells": [],
"metadata": {
"language_info": {
"name": "python"
}
},
"nbformat": 4,
"nbformat_minor": 2
}
