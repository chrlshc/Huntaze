import SwiftUI

struct ContentView: View {
    @Binding var ingestToken: String?
    @Binding var userId: String?
    @State private var status: String = "Waiting for token…"

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Huntaze Connect")
                .font(.title2).bold()
            Text("This helper opens OnlyFans login and securely ingests your session.")
                .foregroundStyle(.secondary)
            HStack {
                Text("Token:")
                Text(ingestToken ?? "—").font(.system(size: 12, weight: .semibold, design: .monospaced)).lineLimit(1).truncationMode(.middle)
            }
            HStack {
                Text("User:")
                Text(userId ?? "—").font(.system(size: 12, weight: .semibold, design: .monospaced)).lineLimit(1).truncationMode(.middle)
            }

            OFLoginWebView(url: URL(string: "https://onlyfans.com/login")!) { cookies in
                guard let token = ingestToken, let uid = userId, !token.isEmpty, !uid.isEmpty else {
                    status = "Missing token or user id"
                    return
                }
                status = "Posting session…"
                ingestToBackend(cookies: cookies, ingestToken: token, userId: uid) { ok in
                    status = ok ? "Session ingested. You can close the app." : "Failed to ingest session"
                    if ok {
                        // One‑shot: drop the token from memory
                        ingestToken = nil
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Text(status).font(.footnote).foregroundStyle(.secondary)
        }
        .padding()
    }
}

