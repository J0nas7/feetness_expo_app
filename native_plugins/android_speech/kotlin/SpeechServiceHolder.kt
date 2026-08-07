package com.j0nas7.feetness_expo_app.speech

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

object SpeechServiceHolder {
    const val EVENT_NAME = "workoutCommand"
    const val PREFERENCES = "feetness_workout"
    const val PAUSED_KEY = "isPaused"
    const val PENDING_COMMAND_KEY = "pendingCommand"

    var service: SpeechService? = null
    var reactContext: ReactApplicationContext? = null
    var listenerCount = 0

    fun emitWorkoutCommand(context: android.content.Context, command: String) {
        context.getSharedPreferences(PREFERENCES, android.content.Context.MODE_PRIVATE)
            .edit()
            .putString(PENDING_COMMAND_KEY, command)
            .apply()

        if (listenerCount <= 0) return
        reactContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(EVENT_NAME, Arguments.createMap().apply { putString("command", command) })
        clearPendingCommand(context)
    }

    fun clearPendingCommand(context: android.content.Context) {
        context.getSharedPreferences(PREFERENCES, android.content.Context.MODE_PRIVATE)
            .edit()
            .remove(PENDING_COMMAND_KEY)
            .apply()
    }
}
