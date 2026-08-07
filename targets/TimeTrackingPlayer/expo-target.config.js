/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "widget",
  name: "TimeTrackingPlayer",
  ios: {
    deploymentTarget: "17.0"
  },
  entitlements: {
    // e.g. app groups if needed
    "com.apple.security.application-groups": [
      "group.com.j0nas7.feetness-expo-app"
    ]
  }
});
