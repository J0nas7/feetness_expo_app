/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
    type: "watch",

    name: "FeetnessWatch",

    deploymentTarget: "10.0",

    entitlements: {}
});
