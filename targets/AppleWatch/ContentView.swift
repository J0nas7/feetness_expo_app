import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var workout: WatchWCManager

    var body: some View {
        Group {
            if workout.isActive || workout.status == "finished" {
                workoutView
            } else {
                waitingView
            }
        }
    }

    private var waitingView: some View {
        VStack(spacing: 10) {
            Image(systemName: "figure.run.circle.fill")
                .font(.system(size: 42))
                .foregroundStyle(.green)
            Text("Feetness")
                .font(.headline)
            Text("Start en træning på din iPhone")
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
                    Text(workout.status == "finished" ? "Afsluttet" : workout.isPaused ? "På pause" : workout.exercise)
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
                Text("\(Int(workout.percent.rounded())) % af mål")
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
                Label(workout.isPaused ? "Fortsæt" : "Pause", systemImage: workout.isPaused ? "play.fill" : "pause.fill")
                    .frame(maxWidth: .infinity)
            }
            .tint(workout.isPaused ? .green : .yellow)
            .disabled(!workout.isReachable)

            Button(role: .destructive) {
                workout.send("stop")
            } label: {
                Label("Stop", systemImage: "stop.fill")
                    .frame(maxWidth: .infinity)
            }
            .disabled(!workout.isReachable)

            connectionLabel
        }
        .padding(.horizontal, 8)
    }

    private var connectionLabel: some View {
        Label(
            workout.isReachable ? "iPhone forbundet" : "Åbn Feetness på iPhone",
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
}
