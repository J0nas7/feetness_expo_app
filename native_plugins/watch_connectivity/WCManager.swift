import Foundation
import WatchConnectivity

final class WCManager: NSObject, WCSessionDelegate {

    static let shared = WCManager()

    private override init() {
        super.init()

        guard WCSession.isSupported() else { return }

        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func sendWorkoutUpdate(distance: Double, pace: Double, elapsed: Int) {
        WCSession.default.sendMessage([
            "distance": distance,
            "pace": pace,
            "elapsed": elapsed
        ], replyHandler: nil)
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        print("📱 iPhone WC activated:", activationState.rawValue)
    }
}
