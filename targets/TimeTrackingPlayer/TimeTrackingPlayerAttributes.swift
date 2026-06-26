//
//  TimeTrackingPlayerLiveActivity.swift
//  TimeTrackingPlayer
//
//  Created by Jonas Alexander Sørensen on 09/01/2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

public struct TimeTrackingPlayerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var distance: String
        var timeSpend: String
        var percent: Double
        var pace: Double
        var exercise: String?
        var goalAmount: Double?
        var goalMetric: String?
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}
