import ActivityKit
import AppIntents
import Foundation

let feetnessAppGroup = "group.com.j0nas7.feetness-expo-app"
let workoutCommandNotification = Notification.Name("FeetnessWorkoutCommand")

enum WorkoutCommand: String {
    case pause
    case resume
    case stop
}

final class WorkoutController {
    static let shared = WorkoutController()

    private let defaults = UserDefaults(suiteName: feetnessAppGroup)!
    private let pausedKey = "workout.isPaused"
    private let commandKey = "workout.pendingCommand"

    var isPaused: Bool {
        defaults.bool(forKey: pausedKey)
    }

    var pendingCommand: String? {
        defaults.string(forKey: commandKey)
    }

    func reset() {
        defaults.set(false, forKey: pausedKey)
        clearPendingCommand()
    }

    func setPaused(_ paused: Bool, notifyReact: Bool = true) async {
        defaults.set(paused, forKey: pausedKey)
        defaults.set(paused ? WorkoutCommand.pause.rawValue : WorkoutCommand.resume.rawValue, forKey: commandKey)
        if #available(iOS 16.2, *) {
            await updateActivities(isPaused: paused)
        }

        if notifyReact {
            NotificationCenter.default.post(
                name: workoutCommandNotification,
                object: paused ? WorkoutCommand.pause.rawValue : WorkoutCommand.resume.rawValue
            )
        }
    }

    func stop() async {
        defaults.set(false, forKey: pausedKey)
        defaults.set(WorkoutCommand.stop.rawValue, forKey: commandKey)
        if #available(iOS 16.2, *) {
            for activity in Activity<TimeTrackingPlayerAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
        NotificationCenter.default.post(
            name: workoutCommandNotification,
            object: WorkoutCommand.stop.rawValue
        )
    }

    func clearPendingCommand() {
        defaults.removeObject(forKey: commandKey)
    }

    @available(iOS 16.2, *)
    private func updateActivities(isPaused: Bool) async {
        for activity in Activity<TimeTrackingPlayerAttributes>.activities {
            let state = activity.content.state
            let updatedState = TimeTrackingPlayerAttributes.ContentState(
                distance: state.distance,
                timeSpend: state.timeSpend,
                percent: state.percent,
                pace: state.pace,
                exercise: state.exercise,
                goalAmount: state.goalAmount,
                goalMetric: state.goalMetric,
                isPaused: isPaused
            )
            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
        }
    }
}

@available(iOS 17.0, *)
struct PauseWorkoutIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "Pause workout"
    static let openAppWhenRun = false

    func perform() async throws -> some IntentResult {
        await WorkoutController.shared.setPaused(true)
        return .result()
    }
}

@available(iOS 17.0, *)
struct ResumeWorkoutIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "Resume workout"
    static let openAppWhenRun = false

    func perform() async throws -> some IntentResult {
        await WorkoutController.shared.setPaused(false)
        return .result()
    }
}

@available(iOS 17.0, *)
struct StopWorkoutIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "Stop workout"
    static let openAppWhenRun = false

    func perform() async throws -> some IntentResult {
        await WorkoutController.shared.stop()
        return .result()
    }
}
