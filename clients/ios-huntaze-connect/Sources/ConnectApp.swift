import SwiftUI

@main
struct ConnectApp: App {
    @State private var ingestToken: String? = nil
    @State private var userId: String? = nil

    var body: some Scene {
        WindowGroup {
            ContentView(ingestToken: $ingestToken, userId: $userId)
                .onOpenURL { url in
                    // Support both Universal Link path (…/connect-of) and custom scheme huntaze://connect
                    if url.host == "connect" || url.path.contains("connect-of") {
                        if let comps = URLComponents(url: url, resolvingAgainstBaseURL: false) {
                            let items = comps.queryItems ?? []
                            ingestToken = items.first(where: { $0.name == "token" })?.value
                            userId = items.first(where: { $0.name == "user" })?.value
                        }
                    }
                }
        }
    }
}

