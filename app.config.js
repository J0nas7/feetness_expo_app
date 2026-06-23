export default {
  "expo": {
    "name": "Feetness",
    "slug": "feetness_expo_app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "feetnessexpoapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.j0nas7.feetness-expo-app",
      "entitlements": {
        "com.apple.security.application-groups": [
          "group.com.j0nas7.feetness-expo-app"
        ],
        "com.apple.developer.healthkit": true
      },
      "infoPlist": {
        "UIApplicationSupportsLiveActivities": true,
        "NSSupportsLiveActivities": true,
        "UIBackgroundModes": [
          "audio",
          "location"
        ],
        "NSHealthShareUsageDescription": "This app reads health data to track your running activity.",
        "NSHealthUpdateUsageDescription": "This app writes workout data to Apple Health."
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.j0nas7.feetness_expo_app",
      "permissions": [
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#209600"
        }
      ],
      "./native_plugins/withLiveActivitiesIOS",
      "./native_plugins/withAndroidSetup",
      "./native_plugins/android_speech/app.plugin.js",
      "@bacons/apple-targets",
      "react-native-health"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
