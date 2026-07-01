# Signing and Gradle Reference

Use this file before editing Android signing configuration.

## Files

```text
android/key.properties
android/app/build.gradle.kts
android/app/build.gradle
android/app/src/main/AndroidManifest.xml
pubspec.yaml
```

## key.properties

Create `android/key.properties` only when the user is ready to configure release signing.

```properties
storePassword=<password-from-keystore-step>
keyPassword=<password-from-keystore-step>
keyAlias=upload
storeFile=<keystore-file-location>
```

Rules:

- Keep this file private.
- Add it to `.gitignore` if missing.
- Never echo real passwords in a final response.

## Kotlin DSL: build.gradle.kts

Use this approach only for:

```text
android/app/build.gradle.kts
```

Load keystore properties before the `android` block:

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}
```

Configure release signing inside `android`:

```kotlin
android {
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = keystoreProperties["storeFile"]?.let { file(it) }
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

## Groovy DSL: build.gradle

Use this approach only for:

```text
android/app/build.gradle
```

Load keystore properties before the `android` block:

```groovy
import java.util.Properties
import java.io.FileInputStream

def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Configure release signing inside `android`:

```groovy
android {
    signingConfigs {
        release {
            keyAlias = keystoreProperties['keyAlias']
            keyPassword = keystoreProperties['keyPassword']
            storeFile = keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword = keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.release
        }
    }
}
```

## After Editing

Run:

```text
flutter clean
flutter pub get
flutter build appbundle
```

`flutter clean` can prevent cached Gradle/build state from obscuring signing changes.

## Common Mistakes

- Mixing Kotlin DSL and Groovy syntax.
- Leaving release builds signed with debug config.
- Committing `key.properties`.
- Using single backslashes in Windows `storeFile`.
- Changing `applicationId` after publishing.
- Updating `applicationId` without moving/updating `MainActivity` package.
