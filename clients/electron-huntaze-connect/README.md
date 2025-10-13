Huntaze Connect (Electron Desktop)

Overview
- Purpose: open OnlyFans login in a BrowserWindow, capture cookies via Electron session.cookies, and POST them to /api/of/cookies/ingest using a short‑lived ingestToken.
- Invocation: custom protocol deep‑link `huntaze-desktop://connect?token=…&user=…`.

Dev Quickstart
1) cd clients/electron-huntaze-connect
2) npm install
3) npm run dev
4) Simulate deep link by running: `npm run simulate -- --url "huntaze-desktop://connect?token=TEST&user=dev-user-123"`

Deep Link Handling
- macOS: app.on('open-url', handler)
- Windows: use single-instance lock and parse argv in 'second-instance' event; for first run, parse process.argv.

Cookie Capture
- After navigation events on the OnlyFans login window, read cookies:
  `const cookies = await session.defaultSession.cookies.get({ domain: 'onlyfans.com' })` plus `.onlyfans.com`.
- Post to backend with Authorization: Bearer {ingestToken} and body { userId, cookies }.

Packaging
- Use electron-builder (config in package.json `build`).
- Ensure the installer registers `huntaze-desktop` protocol on install.

Security
- Do not log cookie values.
- Invalidate token server-side after first successful ingest (one‑shot).

