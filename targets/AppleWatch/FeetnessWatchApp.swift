import SwiftUI

@main
struct FeetnessWatchApp: App {
    @StateObject private var workout = WatchWCManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(workout)
        }
    }
}
