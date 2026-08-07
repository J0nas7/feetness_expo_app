package com.j0nas7.feetness_expo_app.speech

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SpeechModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    init {
        SpeechServiceHolder.reactContext = reactContext
    }

    override fun getName() = "BackgroundSpeechAndroid"

    @ReactMethod
    fun startService() = startService(Intent(reactContext, SpeechService::class.java))

    @ReactMethod
    fun startWorkout(exercise: String, goalAmount: Double, goalMetric: String) {
        startService(serviceIntent(SpeechService.ACTION_START).apply {
            putExtra(SpeechService.EXTRA_EXERCISE, exercise)
            putExtra(SpeechService.EXTRA_GOAL_AMOUNT, goalAmount)
            putExtra(SpeechService.EXTRA_GOAL_METRIC, goalMetric)
        })
    }

    @ReactMethod
    fun updateWorkout(
        exercise: String,
        distanceKm: Double,
        elapsedSeconds: Double,
        percent: Double,
        pace: Double,
        goalAmount: Double,
        goalMetric: String,
    ) {
        startService(serviceIntent(SpeechService.ACTION_UPDATE).apply {
            putExtra(SpeechService.EXTRA_EXERCISE, exercise)
            putExtra(SpeechService.EXTRA_DISTANCE, distanceKm)
            putExtra(SpeechService.EXTRA_ELAPSED, elapsedSeconds.toInt())
            putExtra(SpeechService.EXTRA_PERCENT, percent.toInt())
            putExtra(SpeechService.EXTRA_PACE, pace)
            putExtra(SpeechService.EXTRA_GOAL_AMOUNT, goalAmount)
            putExtra(SpeechService.EXTRA_GOAL_METRIC, goalMetric)
        })
    }

    @ReactMethod
    fun setWorkoutPaused(paused: Boolean) {
        startService(serviceIntent(if (paused) SpeechService.ACTION_PAUSE else SpeechService.ACTION_RESUME).apply {
            putExtra(SpeechService.EXTRA_NOTIFY_REACT, false)
        })
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isWorkoutPaused(): Boolean = reactContext
        .getSharedPreferences(SpeechServiceHolder.PREFERENCES, android.content.Context.MODE_PRIVATE)
        .getBoolean(SpeechServiceHolder.PAUSED_KEY, false)

    @ReactMethod
    fun endWorkout() {
        reactContext.stopService(Intent(reactContext, SpeechService::class.java))
        reactContext.getSharedPreferences(SpeechServiceHolder.PREFERENCES, android.content.Context.MODE_PRIVATE)
            .edit()
            .putBoolean(SpeechServiceHolder.PAUSED_KEY, false)
            .remove(SpeechServiceHolder.PENDING_COMMAND_KEY)
            .apply()
    }

    @ReactMethod
    fun speak(text: String) {
        SpeechServiceHolder.service?.speak(text)
    }

    @ReactMethod
    fun stop() {
        SpeechServiceHolder.service?.stopSpeaking()
    }

    @ReactMethod
    fun stopService() = endWorkout()

    @ReactMethod
    fun addListener(eventName: String) {
        SpeechServiceHolder.listenerCount += 1
        val preferences = reactContext.getSharedPreferences(
            SpeechServiceHolder.PREFERENCES,
            android.content.Context.MODE_PRIVATE,
        )
        preferences.getString(SpeechServiceHolder.PENDING_COMMAND_KEY, null)?.let { command ->
            SpeechServiceHolder.emitWorkoutCommand(reactContext, command)
        }
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        SpeechServiceHolder.listenerCount =
            (SpeechServiceHolder.listenerCount - count.toInt()).coerceAtLeast(0)
    }

    private fun serviceIntent(action: String) =
        Intent(reactContext, SpeechService::class.java).setAction(action)

    private fun startService(intent: Intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }
}
