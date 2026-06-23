/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
    type: "watch",

    name: "FeetnessWatch",

    ios: {
        deploymentTarget: "10.0"
    },

    entitlements: {
        "com.apple.security.application-groups": [
            "group.com.j0nas7.feetness_expo_app"
        ],

        "com.apple.developer.healthkit": true
    }
});
