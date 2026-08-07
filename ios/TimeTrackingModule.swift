//
//  TimeTrackingModule.swift
//  feetness_expo_app
//
//  Created by Jonas Alexander Sørensen on 09/01/2026.
//

import Foundation
import ActivityKit
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

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

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
      if #available(iOS 16.1, *) {
        WorkoutController.shared.reset()
        let timeTrackingAttributes = TimeTrackingPlayerAttributes(name: "Time Tracking")
        let timeTrackingContentState = TimeTrackingPlayerAttributes.ContentState.init(
          distance: "0 km",
          timeSpend: "00:00:00",
          percent: 0.0,
          pace: 0.0,
          exercise: nil,
          goalAmount: nil,
          goalMetric: nil,
          isPaused: false
        )

        print("Swift Start TimeTracking Live Activity")
        let activity = try Activity<TimeTrackingPlayerAttributes>.request(
          attributes: timeTrackingAttributes,
          contentState: timeTrackingContentState,
          pushType: nil
        )

        self.currentActivity = activity
      } else {
        print("Live Activity is not supported on this device")
      }
    } catch (let error) {
      print("There is some error with TimeTrackingModule: \(error)")
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
    do {
      if #available(iOS 16.1, *) {
        let timeTrackingContentState = TimeTrackingPlayerAttributes.ContentState.init(
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
          if let activity = self.currentActivity {
              print("Swift Update TimeTracking Live Activity")
              await activity.update(using: timeTrackingContentState)
          } else {
              print("⚠️ No active Live Activity found")
          }
        }
      } else {
        print("Live Activity is not supported on this device")
      }
    } catch (let error) {
      print("There is some error with TimeTrackingModule: \(error)")
    }
  }

  @objc(endActivity)
  func endActivity() {
    Task {
      if #available(iOS 16.2, *) {
        if let activity = self.currentActivity {
            await activity.end(nil, dismissalPolicy: .immediate)
            self.currentActivity = nil
        }
      } else {
        print("Live Activity is not supported on this device")
      }
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
