import Foundation
import WatchConnectivity

final class WatchWCManager: NSObject, WCSessionDelegate {

    static let shared = WatchWCManager()

    private override init() {
        super.init()

        guard WCSession.isSupported() else { return }

        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        print("⌚ Watch WC activated:", activationState.rawValue)
    }

    func session(
        _ session: WCSession,
        didReceiveMessage message: [String : Any]
    ) {
        print("⌚ received:", message)

        // THIS is where you update SwiftUI state later
    }
}
