import Foundation
import Combine
import WatchConnectivity
import WatchKit

struct WatchBucketAlert: Identifiable, Equatable {
    let id: String
    let kind: String
    let title: String
    let message: String
    let displayMessage: String
}

@MainActor
final class WatchWCManager: NSObject, ObservableObject {
    static let shared = WatchWCManager()

    @Published private(set) var status = "idle"
    @Published private(set) var exercise = "Feetness"
    @Published private(set) var distance = 0.0
    @Published private(set) var pace = 0.0
    @Published private(set) var elapsed = 0
    @Published private(set) var calories = 0.0
    @Published private(set) var percent = 0.0
    @Published private(set) var goalAmount = 0.0
    @Published private(set) var goalMetric = "distance"
    @Published private(set) var isReachable = false
    @Published private(set) var bucketAlert: WatchBucketAlert?

    private var seenBucketIDs = Set<String>()
    private var pendingBucketAlerts: [WatchBucketAlert] = []
    private var bucketDismissTask: Task<Void, Never>?

    private override init() {
        super.init()
        guard WCSession.isSupported() else { return }

        let session = WCSession.default
        session.delegate = self
        session.activate()
        apply(session.receivedApplicationContext)
        isReachable = session.isReachable
    }

    var isActive: Bool { status == "running" || status == "paused" }
    var isPaused: Bool { status == "paused" }

    func send(_ command: String) {
        guard isActive, WCSession.default.isReachable else { return }
        WCSession.default.sendMessage(
            ["command": command, "sentAt": Date().timeIntervalSince1970],
            replyHandler: nil
        ) { error in
            print("Unable to send workout command: \(error)")
        }
    }

    func dismissBucketAlert() {
        bucketDismissTask?.cancel()
        bucketDismissTask = nil
        bucketAlert = nil
        showNextBucketAlert()
    }

    private func enqueueBucketAlerts(from message: [String: Any]) {
        guard let updates = message["bucketUpdates"] as? [[String: Any]] else { return }

        for update in updates {
            guard let id = update["id"] as? String,
                  let kind = update["kind"] as? String,
                  let title = update["title"] as? String,
                  let text = update["message"] as? String,
                  let displayText = update["displayMessage"] as? String,
                  let createdAt = update["createdAt"] as? Double,
                  Date().timeIntervalSince1970 * 1_000 - createdAt < 30_000,
                  seenBucketIDs.insert(id).inserted else { continue }

            pendingBucketAlerts.append(
                WatchBucketAlert(
                    id: id,
                    kind: kind,
                    title: title,
                    message: text,
                    displayMessage: displayText
                )
            )
        }

        showNextBucketAlert()
    }

    private func showNextBucketAlert() {
        guard bucketAlert == nil, !pendingBucketAlerts.isEmpty else { return }
        bucketAlert = pendingBucketAlerts.removeFirst()
        WKInterfaceDevice.current().play(.notification)

        bucketDismissTask?.cancel()
        bucketDismissTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 30_000_000_000)
            guard !Task.isCancelled else { return }
            self?.dismissBucketAlert()
        }
    }

    private func apply(_ message: [String: Any]) {
        guard let incomingStatus = message["status"] as? String else { return }
        status = incomingStatus
        exercise = message["exercise"] as? String ?? exercise
        distance = message["distance"] as? Double ?? distance
        pace = message["pace"] as? Double ?? pace
        elapsed = message["elapsed"] as? Int ?? elapsed
        calories = message["calories"] as? Double ?? calories
        percent = message["percent"] as? Double ?? percent
        goalAmount = message["goalAmount"] as? Double ?? goalAmount
        goalMetric = message["goalMetric"] as? String ?? goalMetric
        enqueueBucketAlerts(from: message)
    }
}

extension WatchWCManager: WCSessionDelegate {
    nonisolated func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if let error { print("Watch Connectivity activation failed: \(error)") }
        Task { @MainActor in
            self.isReachable = session.isReachable
            self.apply(session.receivedApplicationContext)
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor in self.isReachable = session.isReachable }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        Task { @MainActor in self.apply(message) }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        Task { @MainActor in self.apply(applicationContext) }
    }

    nonisolated func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        Task { @MainActor in self.apply(userInfo) }
    }
}
