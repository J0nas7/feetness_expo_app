import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.IBinder
import android.os.Build
import android.speech.tts.TextToSpeech
import java.util.*
import android.speech.tts.UtteranceProgressListener
import com.j0nas7.feetness_expo_app.speech.SpeechNotification
import com.j0nas7.feetness_expo_app.speech.SpeechServiceHolder

class SpeechService : Service(), TextToSpeech.OnInitListener {

    private lateinit var tts: TextToSpeech
    private lateinit var audioManager: AudioManager
    private var focusRequest: AudioFocusRequest? = null

    override fun onCreate() {
        super.onCreate()
        SpeechServiceHolder.service = this

        tts = TextToSpeech(this, this)
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager

        startForeground(
            1,
            SpeechNotification.create(this, "Workout in progress")
        )
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts.language = Locale("da", "DK")
        }

        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {

            override fun onStart(utteranceId: String?) {}

            override fun onDone(utteranceId: String?) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
                } else {
                    audioManager.abandonAudioFocus(null)
                }
            }

            override fun onError(utteranceId: String?) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
                } else {
                    audioManager.abandonAudioFocus(null)
                }
            }
        })
    }

    fun speak(text: String) {
        // Request ducking
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            focusRequest = AudioFocusRequest.Builder(
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            ).build()

            audioManager.requestAudioFocus(focusRequest!!)

        } else {

            audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            )

        }

        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "speech")
    }

    override fun onDestroy() {
        tts.shutdown()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
        } else {
            audioManager.abandonAudioFocus(null)
        }

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
