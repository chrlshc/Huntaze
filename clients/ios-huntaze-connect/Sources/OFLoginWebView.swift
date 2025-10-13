import SwiftUI
import WebKit

final class WebViewCoordinator: NSObject, WKNavigationDelegate {
    let onLoginDetected: () -> Void
    init(onLoginDetected: @escaping () -> Void) { self.onLoginDetected = onLoginDetected }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // didFinish signals main frame load completed
        onLoginDetected()
    }
}

struct OFLoginWebView: UIViewRepresentable {
    let url: URL
    let onLogin: (_ cookies: [HTTPCookie]) -> Void

    func makeUIView(context: Context) -> WKWebView {
        let cfg = WKWebViewConfiguration()
        let wv = WKWebView(frame: .zero, configuration: cfg)
        wv.navigationDelegate = WebViewCoordinator {
            WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
                // Filter only onlyfans.com cookies and wait for a clear session cookie signal
                let ofCookies = cookies.filter { $0.domain.contains("onlyfans.com") }
                let hasSess = ofCookies.contains { $0.name.lowercased() == "sess" || $0.name.lowercased() == "auth_id" }
                if hasSess { onLogin(ofCookies) }
            }
        }
        wv.load(URLRequest(url: url))
        return wv
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
