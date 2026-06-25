//
//  TimeTrackingModule.swift
//  feetness_expo_app
//
//  Created by Jonas Alexander Sørensen on 09/01/2026.
//

import Foundation
import ActivityKit

@available(iOS 16.1, *)
@objc(TimeTracking)
class TimeTracking: NSObject {

  private var currentActivity: Activity<TimeTrackingPlayerAttributes>?

  @objc(startActivity)
  func startActivity() {
    do {
      if #available(iOS 16.1, *) {
        let timeTrackingAttributes = TimeTrackingPlayerAttributes(name: "Time Tracking")
        let timeTrackingContentState = TimeTrackingPlayerAttributes.ContentState.init(
          distance: "0 km",
          timeSpend: "00:00:00",
          percent: 0.0
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

  @objc(updateActivity:timeSpend:percent:exercise:goalAmount:goalMetric:)
  func updateActivity(
    distance: String,
    timeSpend: String,
    percent: NSNumber,
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
          exercise: exercise,
          goalAmount: goalAmount?.doubleValue,
          goalMetric: goalMetric
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
}

