import ActivityKit
import Foundation
import React

@available(iOS 16.1, *)
@objc(TimeTracking)
class TimeTracking: RCTEventEmitter {
  private var currentActivity: Activity<TimeTrackingPlayerAttributes>?
  private var hasListeners = false

  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleWorkoutCommand(_:)),
      name: workoutCommandNotification,
      object: nil
    )
  }

  deinit { NotificationCenter.default.removeObserver(self) }
  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! { ["workoutCommand"] }

  override func startObserving() {
    hasListeners = true
    if let command = WorkoutController.shared.pendingCommand {
      sendEvent(withName: "workoutCommand", body: ["command": command])
      WorkoutController.shared.clearPendingCommand()
    }
  }

  override func stopObserving() { hasListeners = false }

  @objc private func handleWorkoutCommand(_ notification: Notification) {
    guard hasListeners, let command = notification.object as? String else { return }
    DispatchQueue.main.async { [weak self] in
      guard let self, self.hasListeners else { return }
      self.sendEvent(withName: "workoutCommand", body: ["command": command])
      WorkoutController.shared.clearPendingCommand()
    }
  }

  @objc(startActivity)
  func startActivity() {
    do {
      WorkoutController.shared.reset()
      let attributes = TimeTrackingPlayerAttributes(name: "Time Tracking")
      let state = TimeTrackingPlayerAttributes.ContentState(
        distance: "0 km",
        timeSpend: "00:00:00",
        percent: 0,
        pace: 0,
        exercise: nil,
        goalAmount: nil,
        goalMetric: nil,
        isPaused: false
      )
      currentActivity = try Activity<TimeTrackingPlayerAttributes>.request(
        attributes: attributes,
        contentState: state,
        pushType: nil
      )
    } catch {
      print("Failed to start TimeTracking Live Activity: \(error)")
    }
  }

  @objc(updateActivity:timeSpend:percent:pace:exercise:goalAmount:goalMetric:)
  func updateActivity(
    distance: String,
    timeSpend: String,
    percent: NSNumber,
    pace: NSNumber,
    exercise: String?,
    goalAmount: NSNumber?,
    goalMetric: String?
  ) {
    let state = TimeTrackingPlayerAttributes.ContentState(
      distance: distance,
      timeSpend: timeSpend,
      percent: percent.doubleValue,
      pace: pace.doubleValue,
      exercise: exercise,
      goalAmount: goalAmount?.doubleValue,
      goalMetric: goalMetric,
      isPaused: WorkoutController.shared.isPaused
    )
    Task {
      let activity = currentActivity ?? Activity<TimeTrackingPlayerAttributes>.activities.first
      await activity?.update(using: state)
      currentActivity = activity
    }
  }

  @objc(endActivity)
  func endActivity() {
    Task {
      for activity in Activity<TimeTrackingPlayerAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
      currentActivity = nil
      WorkoutController.shared.reset()
    }
  }

  @objc(setWorkoutPaused:)
  func setWorkoutPaused(_ paused: Bool) {
    Task {
      await WorkoutController.shared.setPaused(paused, notifyReact: false)
      WorkoutController.shared.clearPendingCommand()
    }
  }

  @objc(isWorkoutPaused)
  func isWorkoutPaused() -> NSNumber {
    NSNumber(value: WorkoutController.shared.isPaused)
  }
}
