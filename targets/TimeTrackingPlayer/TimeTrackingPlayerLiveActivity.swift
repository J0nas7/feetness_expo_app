//
//  TimeTrackingPlayerLiveActivity.swift
//  TimeTrackingPlayer
//
//  Created by Jonas Alexander Sørensen on 09/01/2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.2, *)
struct TimeTrackingPlayerLiveActivity: Widget {
    var exerciseIcons = [
        "cycling": "figure.outdoor.cycle",
        "running": "figure.run",
        "walking": "figure.walk"
    ]

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimeTrackingPlayerAttributes.self) { context in
            // Lock screen/banner UI goes here
            let paceMinutes = Int(context.state.pace)
            let paceSeconds = Int((context.state.pace - Double(paceMinutes)) * 60)

            HStack {
                VStack(alignment: .leading) {
                    HStack {
                        Image(systemName: "stopwatch.fill")
                            .foregroundColor(.green)

                        Text("\(context.state.timeSpend)")
                            .font(.system(size: 18))
                    }

                    HStack {
                        Image(systemName: "shoeprints.fill")
                            .foregroundColor(.green)

                        Text("\(context.state.distance)")
                            .font(.system(size: 28, weight: .bold))
                    }

                    HStack {
                        Text(String(format: localized("goal"), Int(context.state.percent)))
                            .font(.system(size: 18))
                            .foregroundColor(.gray)

                        Text(context.state.goalAmount != nil && context.state.goalMetric != nil ? "\(String(format: "%.2f", context.state.goalAmount!)) \(context.state.goalMetric!)" : "")
                            .font(.system(size: 18))
                            .foregroundColor(.gray)
                    }

                    ProgressView(value: context.state.percent, total: 100)
                            .progressViewStyle(LinearProgressViewStyle(tint: .green))
                }

                Spacer()

                VStack(alignment: .trailing) {
                    HStack {
                        Image(systemName: exerciseIcons[context.state.exercise ?? ""] ?? "figure.run")
                            .foregroundColor(.green)

                        VStack(alignment: .trailing) {
                            Text(localizedExercise(context.state.exercise))
                                .font(.system(size: 18))
                                .foregroundColor(.gray)

                            Text("\(paceMinutes):\(String(format: "%02d", paceSeconds)) min/km")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                        }
                    }

                    workoutControls(isPaused: context.state.isPaused)
                }
            }
            .padding(10)
            .activityBackgroundTint(Color.white)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    workoutControls(isPaused: context.state.isPaused)
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T")
            } minimal: {
                Text("M")
            }
            .widgetURL(URL(string: "feetnessexpoapp://"))
            .keylineTint(Color.red)
        }
    }

    @ViewBuilder
    private func workoutControls(isPaused: Bool) -> some View {
        HStack(spacing: 14) {
            if isPaused {
                Button(intent: ResumeWorkoutIntent()) {
                    controlIcon("play.fill", color: .green)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(localized("resume_workout"))
            } else {
                Button(intent: PauseWorkoutIntent()) {
                    controlIcon("pause.fill", color: .orange)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(localized("pause_workout"))
            }

            Button(intent: StopWorkoutIntent()) {
                controlIcon("stop.fill", color: .red)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(localized("stop_workout"))
        }
    }

    private func controlIcon(_ systemName: String, color: Color) -> some View {
        Circle()
            .fill(color)
            .frame(width: 44, height: 44)
            .overlay(
                Image(systemName: systemName)
                    .foregroundColor(.white)
            )
    }

    private func localized(_ key: String) -> String { NSLocalizedString(key, comment: "") }

    private func localizedExercise(_ exercise: String?) -> String {
        let keys = ["cycling": "cycling", "running": "running", "walking": "walking"]
        guard let exercise else { return localized("unknown_exercise") }
        return keys[exercise].map { localized($0) } ?? exercise
    }
}

extension TimeTrackingPlayerAttributes {
    fileprivate static var preview: TimeTrackingPlayerAttributes {
        TimeTrackingPlayerAttributes(name: "World")
    }
}

extension TimeTrackingPlayerAttributes.ContentState {
    fileprivate static var smiley: TimeTrackingPlayerAttributes.ContentState {
        TimeTrackingPlayerAttributes.ContentState(
            distance: "To do 📝",
            timeSpend: "00:00:00",
            percent: 0.0,
            pace: 0.0,
            exercise: "Ukendt øvelse",
            goalAmount: nil,
            goalMetric: nil,
            isPaused: false
        )
     }
}
