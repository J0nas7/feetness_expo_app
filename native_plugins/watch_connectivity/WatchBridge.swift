import Foundation
import React
import WatchConnectivity

private let watchCommandNotification = Notification.Name("FeetnessWatchCommand")

private final class PhoneWatchSession: NSObject, WCSessionDelegate {
  static let shared = PhoneWatchSession()

  private var latestSnapshot: [String: Any] = ["status": "idle"]

  private override init() {
    super.init()
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func publish(_ snapshot: [String: Any]) {
    latestSnapshot = snapshot
    guard WCSession.isSupported() else { return }

    let session = WCSession.default
    guard session.activationState == .activated,
          session.isPaired,
          session.isWatchAppInstalled else { return }

    do {
      try session.updateApplicationContext(snapshot)
    } catch {
      print("Unable to update Watch workout context: \(error)")
    }

    if session.isReachable {
      session.sendMessage(snapshot, replyHandler: nil) { error in
        print("Unable to send live Watch workout update: \(error)")
      }
    }

    if snapshot["bucketUpdates"] != nil {
      session.transferUserInfo(snapshot)
    }
  }

  private func receive(_ message: [String: Any]) {
    guard let command = message["command"] as? String,
          ["pause", "resume", "stop"].contains(command) else { return }
    NotificationCenter.default.post(name: watchCommandNotification, object: command)
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    if let error { print("Watch Connectivity activation failed: \(error)") }
    if activationState == .activated { publish(latestSnapshot) }
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    receive(message)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
    receive(userInfo)
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }
}

@objc(WatchBridge)
final class WatchBridge: RCTEventEmitter {
  private var hasListeners = false

  override init() {
    super.init()
    _ = PhoneWatchSession.shared
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleCommand(_:)),
      name: watchCommandNotification,
      object: nil
    )
  }

  deinit { NotificationCenter.default.removeObserver(self) }

  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! { ["watchWorkoutCommand"] }
  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  @objc private func handleCommand(_ notification: Notification) {
    guard hasListeners, let command = notification.object as? String else { return }
    DispatchQueue.main.async { [weak self] in
      self?.sendEvent(withName: "watchWorkoutCommand", body: ["command": command])
    }
  }

  @objc(publishWorkout:)
  func publishWorkout(_ snapshot: NSDictionary) {
    PhoneWatchSession.shared.publish(snapshot as? [String: Any] ?? [:])
  }
}
