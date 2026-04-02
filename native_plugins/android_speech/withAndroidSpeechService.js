const fs = require("fs");
const path = require("path");

function copySpeechFiles(projectRoot, packageName) {
    const source = path.join(projectRoot, "native_plugins", "android_speech", "kotlin");
    const packagePath = packageName.replace(/\./g, "/");
    const dest = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "java",
        packagePath,
        "speech"
    );

    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(source);
    for (const file of files) {
        fs.copyFileSync(path.join(source, file), path.join(dest, file));
    }
    console.log(`🚀 Copied Kotlin files: ${files.join(", ")}`);
}

const withAndroidSpeechService = (config) => {
    return require("@expo/config-plugins").withDangerousMod(config, [
        "android",
        async (mod) => {
            const packageName =
                mod?.manifest?.applicationId || "com.j0nas7.feetness_expo_app";
            copySpeechFiles(mod.modRequest.projectRoot, packageName);
            return mod;
        },
    ]);
};

module.exports = withAndroidSpeechService;
