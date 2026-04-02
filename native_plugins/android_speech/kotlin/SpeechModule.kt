package com.j0nas7.feetness_expo_app.speech

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SpeechModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BackgroundSpeechAndroid"

    @ReactMethod
    fun startService() {
        val intent = Intent(reactApplicationContext, SpeechService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
    }

    @ReactMethod
    fun speak(text: String) {
        SpeechServiceHolder.service?.speak(text)
    }

    @ReactMethod
    fun stopService() {
        val intent = Intent(reactApplicationContext, SpeechService::class.java)
        reactApplicationContext.stopService(intent)
    }
}
