package com.j0nas7.feetness_expo_app.speech

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import com.j0nas7.feetness_expo_app.R
import java.util.Locale

data class WorkoutNotificationState(
    val exercise: String = "Workout",
    val distanceKm: Double = 0.0,
    val elapsedSeconds: Int = 0,
    val percent: Int = 0,
    val pace: Double = 0.0,
    val goalAmount: Double? = null,
    val goalMetric: String? = null,
    val isPaused: Boolean = false,
)

object SpeechNotification {
    const val CHANNEL_ID = "workout_channel"
    const val NOTIFICATION_ID = 4107

    fun create(context: Context, state: WorkoutNotificationState): Notification {
        ensureChannel(context)

        val elapsed = "%d:%02d".format(
            Locale.US,
            state.elapsedSeconds / 60,
            state.elapsedSeconds % 60,
        )
        val pace = if (state.pace.isFinite() && state.pace > 0) {
            val minutes = state.pace.toInt()
            val seconds = ((state.pace - minutes) * 60).toInt().coerceIn(0, 59)
            "%d:%02d min/km".format(Locale.US, minutes, seconds)
        } else {
            "– min/km"
        }
        val goal = if (state.goalAmount != null && state.goalMetric != null) {
            "Goal ${formatGoal(state.goalAmount)} ${state.goalMetric}"
        } else {
            "Workout goal"
        }
        val status = if (state.isPaused) "Paused" else "In progress"

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle("${state.exercise} · $status")
            .setContentText("${formatDistance(state.distanceKm)} km · $elapsed · $pace")
            .setSubText("$goal · ${state.percent.coerceIn(0, 100)}%")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(openAppIntent(context))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setProgress(100, state.percent.coerceIn(0, 100), false)
            .setStyle(
                NotificationCompat.ProgressStyle()
                    .setProgress(state.percent.coerceIn(0, 100))
                    .setStyledByProgress(true),
            )
            .addExtras(Bundle().apply {
                if (Build.VERSION.SDK_INT >= 36) {
                    putBoolean("android.requestPromotedOngoing", true)
                }
            })

        if (state.isPaused) {
            builder.addAction(
                android.R.drawable.ic_media_play,
                "Fortsæt",
                serviceAction(context, SpeechService.ACTION_RESUME, 2),
            )
        } else {
            builder.addAction(
                android.R.drawable.ic_media_pause,
                "Pause",
                serviceAction(context, SpeechService.ACTION_PAUSE, 1),
            )
        }
        builder.addAction(
            android.R.drawable.ic_menu_close_clear_cancel,
            "Stop",
            serviceAction(context, SpeechService.ACTION_STOP, 3),
        )

        return builder.build()
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Active workout",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Workout progress and controls"
            setSound(null, null)
            enableVibration(false)
        }
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun openAppIntent(context: Context): PendingIntent {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: Intent()
        return PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun serviceAction(context: Context, action: String, requestCode: Int): PendingIntent =
        PendingIntent.getService(
            context,
            requestCode,
            Intent(context, SpeechService::class.java).setAction(action),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    private fun formatDistance(value: Double) = String.format(Locale.US, "%.2f", value)
    private fun formatGoal(value: Double) = String.format(Locale.US, "%.2f", value)
}
