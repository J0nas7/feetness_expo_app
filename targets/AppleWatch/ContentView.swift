import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var workout: WatchWCManager

    var body: some View {
        ZStack {
            Group {
                if workout.isActive || workout.status == "finished" {
                    workoutView
                } else {
                    waitingView
                }
            }

            if let alert = workout.bucketAlert {
                bucketOverlay(alert)
                    .transition(.opacity.combined(with: .scale(scale: 0.92)))
                    .zIndex(1)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: workout.bucketAlert)
    }

    private func bucketOverlay(_ alert: WatchBucketAlert) -> some View {
        ZStack {
            Color.black
            .ignoresSafeArea()

            VStack(spacing: 7) {
                Image(systemName: bucketIcon(alert.kind))
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundStyle(.green)

                Text(alert.title)
                    .font(.headline)
                    .foregroundStyle(.white)

                Text(alert.displayMessage)
                    .font(.callout)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .lineLimit(4)
                    .minimumScaleFactor(0.7)
                    .fixedSize(horizontal: false, vertical: true)

                Text(localized("dismiss_hint"))
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.7))
            }
            .padding()
        }
        .contentShape(Rectangle())
        .onTapGesture { workout.dismissBucketAlert() }
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel("\(alert.title). \(alert.message). \(localized("dismiss_hint"))")
    }

    private func bucketIcon(_ kind: String) -> String {
        switch kind {
        case "distance": return "figure.run"
        case "monthPlan": return "calendar"
        default: return "target"
        }
    }

    private var waitingView: some View {
        VStack(spacing: 10) {
            Image(systemName: "figure.run.circle.fill")
                .font(.system(size: 42))
                .foregroundStyle(.green)
            Text("Feetness")
                .font(.headline)
            Text(localized("start_on_iphone"))
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            connectionLabel
        }
        .padding()
    }

    private var workoutView: some View {
        TabView {
            VStack(spacing: 5) {
                HStack {
                    Circle()
                        .fill(workout.isPaused ? .yellow : workout.status == "finished" ? .gray : .green)
                        .frame(width: 7, height: 7)
                    Text(workout.status == "finished" ? localized("finished") : workout.isPaused ? localized("paused") : localizedExercise(workout.exercise))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Text(formatTime(workout.elapsed))
                    .font(.system(size: 34, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                HStack(spacing: 18) {
                    metric(value: String(format: "%.2f", workout.distance / 1_000), label: "KM")
                    metric(value: formatPace(workout.pace), label: "MIN/KM")
                }

                ProgressView(value: min(max(workout.percent / 100, 0), 1))
                    .tint(.green)
                Text(String(format: localized("goal_progress"), Int(workout.percent.rounded())))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 8)

            if workout.isActive {
                controls
            }
        }
        .tabViewStyle(.verticalPage)
    }

    private var controls: some View {
        VStack(spacing: 10) {
            Button {
                workout.send(workout.isPaused ? "resume" : "pause")
            } label: {
                Label(workout.isPaused ? localized("resume") : localized("pause"), systemImage: workout.isPaused ? "play.fill" : "pause.fill")
                    .frame(maxWidth: .infinity)
            }
            .tint(workout.isPaused ? .green : .yellow)
            .disabled(!workout.isReachable)

            Button(role: .destructive) {
                workout.send("stop")
            } label: {
                Label(localized("stop"), systemImage: "stop.fill")
                    .frame(maxWidth: .infinity)
            }
            .disabled(!workout.isReachable)

            connectionLabel
        }
        .padding(.horizontal, 8)
    }

    private var connectionLabel: some View {
        Label(
            workout.isReachable ? localized("iphone_connected") : localized("open_on_iphone"),
            systemImage: workout.isReachable ? "iphone.radiowaves.left.and.right" : "iphone.slash"
        )
        .font(.caption2)
        .foregroundStyle(workout.isReachable ? Color.secondary : Color.orange)
    }

    private func metric(value: String, label: String) -> some View {
        VStack(spacing: 1) {
            Text(value).font(.headline).monospacedDigit()
            Text(label).font(.system(size: 9)).foregroundStyle(.secondary)
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        String(format: "%02d:%02d:%02d", seconds / 3_600, (seconds % 3_600) / 60, seconds % 60)
    }

    private func formatPace(_ pace: Double) -> String {
        guard pace.isFinite, pace > 0 else { return "–:––" }
        let minutes = Int(pace)
        return String(format: "%d:%02d", minutes, Int((pace - Double(minutes)) * 60))
    }

    private func localized(_ key: String) -> String {
        NSLocalizedString(key, comment: "")
    }

    private func localizedExercise(_ exercise: String) -> String {
        let keys = ["cycling": "cycling", "running": "running", "walking": "walking"]
        return keys[exercise].map { localized($0) } ?? exercise
    }
}
