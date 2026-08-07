const {
    AndroidConfig,
    withAndroidManifest,
    withAppBuildGradle,
    withDangerousMod,
    withMainApplication,
} = require("@expo/config-plugins");
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
        "speech",
    );

    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(source).filter((file) => file.endsWith(".kt"));
    for (const file of files) {
        const contents = fs.readFileSync(path.join(source, file), "utf8")
            .replaceAll("com.j0nas7.feetness_expo_app", packageName);
        fs.writeFileSync(path.join(dest, file), contents);
    }
    console.log(`🚀 Copied Kotlin files: ${files.join(", ")}`);
}

module.exports = function withAndroidSpeechService(config) {
    config = withDangerousMod(config, [
        "android",
        async (mod) => {
            copySpeechFiles(mod.modRequest.projectRoot, mod.android?.package || "com.j0nas7.feetness_expo_app");
            return mod;
        },
    ]);

    config = withAndroidManifest(config, (mod) => {
        const manifest = mod.modResults.manifest;
        const permissions = manifest["uses-permission"] || [];
        for (const name of [
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.POST_PROMOTED_NOTIFICATIONS",
        ]) {
            if (!permissions.some((permission) => permission.$?.["android:name"] === name)) {
                permissions.push({ $: { "android:name": name } });
            }
        }
        manifest["uses-permission"] = permissions;

        const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
        application.service = application.service || [];
        const serviceName = ".speech.SpeechService";
        if (!application.service.some((service) => service.$?.["android:name"] === serviceName)) {
            application.service.push({
                $: {
                    "android:name": serviceName,
                    "android:exported": "false",
                    "android:foregroundServiceType": "mediaPlayback",
                },
            });
        }
        return mod;
    });

    config = withAppBuildGradle(config, (mod) => {
        const dependency = 'implementation("androidx.core:core-ktx:1.17.0")';
        if (!mod.modResults.contents.includes(dependency)) {
            mod.modResults.contents = mod.modResults.contents.replace(
                /dependencies\s*\{/,
                `dependencies {\n    ${dependency}`,
            );
        }
        return mod;
    });

    return withMainApplication(config, (mod) => {
        const packageName = mod.android?.package || "com.j0nas7.feetness_expo_app";
        let contents = mod.modResults.contents;
        const importLine = `import ${packageName}.speech.SpeechPackage`;
        if (!contents.includes(importLine)) {
            contents = contents.replace(
                /import com\.facebook\.react\.PackageList/,
                `import com.facebook.react.PackageList\n${importLine}`,
            );
        }
        if (!contents.includes("add(SpeechPackage())")) {
            contents = contents.replace(
                /PackageList\(this\)\.packages\.apply \{/,
                "PackageList(this).packages.apply {\n              add(SpeechPackage())",
            );
        }
        mod.modResults.contents = contents;
        return mod;
    });
};
