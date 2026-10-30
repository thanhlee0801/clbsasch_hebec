plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val packageStoreHtml by tasks.registering(Copy::class) {
    from(file("../../../../Websie_banhang/nha_sach_hebec_home.html")) {
        rename { "index.html" }
    }
    from(file("../../../../Websie_banhang/assets/brand")) {
        into("assets/brand")
    }
    from(file("../../../../Websie_banhang/assets/products")) {
        into("assets/products")
    }
    from(file("../../../../Websie_banhang/assets/banners/hebec-sale.png")) {
        into("assets/banners")
    }
    into(layout.projectDirectory.dir("src/main/assets/site"))
}

tasks.named("preBuild").configure {
    dependsOn(packageStoreHtml)
}

android {
    namespace = "com.example.hebec_books"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.hebec_books"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
