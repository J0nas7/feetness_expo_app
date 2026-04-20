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
        let timeTrackingContentState = TimeTrackingPlayerAttributes.ContentState.init(taskName: "Working on a task", timeSpend: "00:00:00")

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
      print("There is some error with TimeTrackingModule")
    }
  }

  @objc(updateActivity:timeSpend:)
  func updateActivity(taskName: String, timeSpend: String) {
    do {
      if #available(iOS 16.1, *) {
        let timeTrackingContentState = TimeTrackingPlayerAttributes.ContentState.init(taskName: taskName, timeSpend: timeSpend)

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
      print("There is some error with TimeTrackingModule")
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
        // Fallback on earlier versions
      }
    }
  }
}

