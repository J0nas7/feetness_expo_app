package com.j0nas7.feetness_expo_app.speech

import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale
import java.util.UUID

class SpeechService : Service(), TextToSpeech.OnInitListener {
    companion object {
        const val ACTION_START = "com.j0nas7.feetness.WORKOUT_START"
        const val ACTION_UPDATE = "com.j0nas7.feetness.WORKOUT_UPDATE"
        const val ACTION_PAUSE = "com.j0nas7.feetness.WORKOUT_PAUSE"
        const val ACTION_RESUME = "com.j0nas7.feetness.WORKOUT_RESUME"
        const val ACTION_STOP = "com.j0nas7.feetness.WORKOUT_STOP"

        const val EXTRA_EXERCISE = "exercise"
        const val EXTRA_DISTANCE = "distance"
        const val EXTRA_ELAPSED = "elapsed"
        const val EXTRA_PERCENT = "percent"
        const val EXTRA_PACE = "pace"
        const val EXTRA_GOAL_AMOUNT = "goalAmount"
        const val EXTRA_GOAL_METRIC = "goalMetric"
        const val EXTRA_NOTIFY_REACT = "notifyReact"
    }

    private lateinit var tts: TextToSpeech
    private lateinit var audioManager: AudioManager
    private var focusRequest: AudioFocusRequest? = null
    private var workout = WorkoutNotificationState()

    override fun onCreate() {
        super.onCreate()
        SpeechServiceHolder.service = this
        tts = TextToSpeech(this, this)
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        workout = workout.copy(isPaused = isWorkoutPaused())
        startForeground(
            SpeechNotification.NOTIFICATION_ID,
            SpeechNotification.create(this, workout),
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                setPaused(false)
                SpeechServiceHolder.clearPendingCommand(this)
                workout = WorkoutNotificationState(
                    exercise = intent.getStringExtra(EXTRA_EXERCISE) ?: "Workout",
                    goalAmount = optionalDouble(intent, EXTRA_GOAL_AMOUNT),
                    goalMetric = intent.getStringExtra(EXTRA_GOAL_METRIC),
                )
                publishNotification()
            }
            ACTION_UPDATE -> {
                workout = workout.copy(
                    exercise = intent.getStringExtra(EXTRA_EXERCISE) ?: workout.exercise,
                    distanceKm = intent.getDoubleExtra(EXTRA_DISTANCE, workout.distanceKm),
                    elapsedSeconds = intent.getIntExtra(EXTRA_ELAPSED, workout.elapsedSeconds),
                    percent = intent.getIntExtra(EXTRA_PERCENT, workout.percent),
                    pace = intent.getDoubleExtra(EXTRA_PACE, workout.pace),
                    goalAmount = optionalDouble(intent, EXTRA_GOAL_AMOUNT) ?: workout.goalAmount,
                    goalMetric = intent.getStringExtra(EXTRA_GOAL_METRIC) ?: workout.goalMetric,
                    isPaused = isWorkoutPaused(),
                )
                publishNotification()
            }
            ACTION_PAUSE -> handlePauseChange(true, intent.getBooleanExtra(EXTRA_NOTIFY_REACT, true))
            ACTION_RESUME -> handlePauseChange(false, intent.getBooleanExtra(EXTRA_NOTIFY_REACT, true))
            ACTION_STOP -> {
                setPaused(false)
                SpeechServiceHolder.emitWorkoutCommand(this, "stop")
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun handlePauseChange(paused: Boolean, notifyReact: Boolean) {
        setPaused(paused)
        workout = workout.copy(isPaused = paused)
        publishNotification()
        if (notifyReact) {
            speak(if (paused) "Pause" else "Fortsæt")
            SpeechServiceHolder.emitWorkoutCommand(this, if (paused) "pause" else "resume")
        }
    }

    private fun publishNotification() {
        getSystemService(NotificationManager::class.java).notify(
            SpeechNotification.NOTIFICATION_ID,
            SpeechNotification.create(this, workout),
        )
    }

    private fun setPaused(paused: Boolean) {
        getSharedPreferences(SpeechServiceHolder.PREFERENCES, MODE_PRIVATE)
            .edit()
            .putBoolean(SpeechServiceHolder.PAUSED_KEY, paused)
            .apply()
    }

    private fun isWorkoutPaused(): Boolean =
        getSharedPreferences(SpeechServiceHolder.PREFERENCES, MODE_PRIVATE)
            .getBoolean(SpeechServiceHolder.PAUSED_KEY, false)

    private fun optionalDouble(intent: Intent, key: String): Double? =
        if (intent.hasExtra(key)) intent.getDoubleExtra(key, 0.0) else null

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) tts.language = Locale("da", "DK")
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) = Unit
            override fun onDone(utteranceId: String?) = abandonAudioFocus()
            override fun onError(utteranceId: String?) = abandonAudioFocus()
        })
    }

    fun speak(text: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).build()
            audioManager.requestAudioFocus(focusRequest!!)
        } else {
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK,
            )
        }
        tts.speak(text, TextToSpeech.QUEUE_ADD, null, "speech-${UUID.randomUUID()}")
    }

    fun stopSpeaking() {
        tts.stop()
        abandonAudioFocus()
    }

    private fun abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            audioManager.abandonAudioFocus(null)
        }
    }

    override fun onDestroy() {
        SpeechServiceHolder.service = null
        tts.shutdown()
        abandonAudioFocus()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
