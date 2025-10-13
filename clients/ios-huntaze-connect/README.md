Huntaze Connect (iOS mini‑app)

Overview
- Purpose: open OnlyFans login in a WKWebView, capture all cookies (including HttpOnly) via WKHTTPCookieStore, and POST them to your backend /api/of/cookies/ingest with a short‑lived ingestToken.
- Invocation: Universal Link to https://app.huntaze.com/connect-of?token=…&user=… (preferred) or custom URL scheme huntaze://connect?token=…&user=… (fallback).

Project Setup (Xcode)
1) Create a new iOS App (SwiftUI, Swift). Bundle ID example: com.huntaze.connect.
2) Add files from ./Sources into your target.
3) Configure Associated Domains entitlement with: applinks:app.huntaze.com (replace with your domain).
4) Add a custom URL scheme (fallback): huntaze under CFBundleURLTypes.
5) Keep App Transport Security ON (HTTPS only).

Universal Links
- Host an AASA (apple-app-site-association) on your domain at: /.well-known/apple-app-site-association
- Use AASA.sample.json as a template and replace TEAMID and BUNDLEID.

Config placeholders
- In Networking.swift, set API_BASE if not using the default https://app.huntaze.com.

Build and Test
- Run on a device (Universal Links require a real device for end‑to‑end testing).
- From the PWA, trigger the Universal Link; the app should open, navigate to OnlyFans login, and after successful login, POST cookies.

Security Notes
- Do not log cookie values.
- Token is short‑lived; invalidate or drop it after first successful POST.

Files
- Sources/ConnectApp.swift: App entry; handles onOpenURL and passes token/user to ContentView.
- Sources/ContentView.swift: Hosts the OFLoginWebView and shows minimal status.
- Sources/OFLoginWebView.swift: WKWebView with didFinish handler to read cookies and call onLogin.
- Sources/Networking.swift: Serialize cookies and POST to backend with Authorization: Bearer {ingestToken}.
- AASA.sample.json: Example apple‑app‑site‑association (fill in your TEAMID and BUNDLEID).

Release Checklist
- Associated Domains: applinks:app.huntaze.com.
- Universal Links debug: Apple TN3155.
- Privacy: app shows OnlyFans login only (no NSFW content displayed).

