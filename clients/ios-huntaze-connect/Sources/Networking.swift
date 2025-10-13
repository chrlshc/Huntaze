import Foundation

private func apiBase() -> String {
    // Optionally override via Info.plist key "API_BASE"
    if let base = Bundle.main.object(forInfoDictionaryKey: "API_BASE") as? String, !base.isEmpty {
        return base.replacingOccurrences(of: "/$", with: "", options: .regularExpression)
    }
    return "https://app.huntaze.com"
}

func ingestToBackend(cookies: [HTTPCookie], ingestToken: String, userId: String, completion: @escaping (Bool) -> Void) {
    let payloadCookies: [[String: Any]] = cookies.map { c in
        return [
            "name": c.name,
            "value": c.value,
            "domain": c.domain,
            "path": c.path,
            "httpOnly": c.isHTTPOnly,
            "secure": c.isSecure,
            "expirationDate": c.expiresDate?.timeIntervalSince1970 ?? NSNull()
        ]
    }
    let body: [String: Any] = [
        "userId": userId,
        "cookies": payloadCookies
    ]
    guard let url = URL(string: apiBase() + "/api/of/cookies/ingest"),
          let data = try? JSONSerialization.data(withJSONObject: body, options: []) else {
        completion(false); return
    }
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    req.addValue("application/json", forHTTPHeaderField: "Content-Type")
    req.addValue("Bearer \(ingestToken)", forHTTPHeaderField: "Authorization")
    req.httpBody = data
    URLSession.shared.dataTask(with: req) { _, resp, err in
        guard err == nil, let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            completion(false); return
        }
        completion(true)
    }.resume()
}

