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
        "Cykling": "figure.outdoor.cycle",
        "Løb": "figure.run",
        "Gågang": "figure.walk"
    ]

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimeTrackingPlayerAttributes.self) { context in
            // Lock screen/banner UI goes here
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
                        Text("Mål: \(Int(context.state.percent))%")
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
                        Image(systemName: exerciseIcons[context.state.exercise ?? "Ukendt øvelse"] ?? "figure.run")
                            .foregroundColor(.green)

                        Text("\(context.state.exercise ?? "Ukendt øvelse")")
                            .font(.system(size: 18))
                            .foregroundColor(.gray)
                    }

                    HStack {
                        // Red button as a link
                        Link(destination: URL(string: "feetness://endLiveActivity")!) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 44, height: 44)
                                .overlay(
                                    Image(systemName: "stop.fill")
                                        .foregroundColor(.white)
                                )
                        }

                        // Green button as a link
                        Link(destination: URL(string: "feetness://startLiveActivity")!) {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 44, height: 44)
                                .overlay(
                                    Image(systemName: "play.fill")
                                        .foregroundColor(.white)
                                )
                        }
                    }
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
                    Text("Bottom")
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T")
            } minimal: {
                Text("M")
            }
            .widgetURL(URL(string: "feetness://endLiveActivity"))
            .keylineTint(Color.red)
        }
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
            exercise: "Ukendt øvelse",
            goalAmount: nil,
            goalMetric: nil
        )
     }
}
