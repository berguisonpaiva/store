---
name: flutter-android-release-build
description: Use this skill whenever building, preparing, signing, troubleshooting, or documenting a Flutter Android release build. Trigger for Flutter Android deployment, Play Store release, AAB, APK, appbundle, keystore, key.properties, Gradle signingConfig, applicationId, versionCode, versionName, multidex, R8, AndroidManifest review, release build commands, or OS-specific build steps on Windows, macOS, or Linux.
---

# Flutter Android Release Build

Use this skill to prepare and build a Flutter Android release artifact using the official Flutter Android deployment flow, while choosing commands correctly for the current operating system.

## Bundled Resources

- Read `references/android-release-checklist.md` before performing or reviewing a release build.
- Read `references/os-command-guide.md` when choosing commands for Windows, macOS, or Linux.
- Read `references/signing-and-gradle.md` before changing keystore, `key.properties`, or Gradle signing config.
- Read `references/source-map.md` for the official documentation source used to create this skill.
- Use `agents/android-release-build-specialist.md` when delegating an Android release-build-only pass.

## First Step: Detect Context

Before giving commands or editing files, identify:

1. Host OS: Windows PowerShell, macOS shell, or Linux shell.
2. Flutter project root: the directory containing `pubspec.yaml`.
3. Android build script type:
   - `android/app/build.gradle.kts` for Kotlin DSL.
   - `android/app/build.gradle` for Groovy DSL.
4. Desired artifact:
   - AAB for Google Play Store.
   - APK for direct distribution/testing.
   - Split APKs when APK distribution needs smaller architecture-specific files.
5. Signing status:
   - Existing upload keystore.
   - Existing `android/key.properties`.
   - Existing release `signingConfig`.
6. Version target:
   - `pubspec.yaml` `version: x.y.z+build`.
   - Optional CLI override: `--build-name` and `--build-number`.

Do not generate or overwrite signing files unless the user explicitly asks. Keystores and passwords are secrets.

## Release Flow

Use this order:

```text
1. Verify environment
2. Review app identity and manifest
3. Configure signing
4. Review Gradle SDK/version settings
5. Run quality checks
6. Build AAB or APK
7. Verify output path
8. Provide next steps for install/upload
```

## Environment Checks

Run from project root:

```text
flutter doctor -v
flutter pub get
flutter analyze
flutter test
```

Adapt test commands to the project. If tests are unavailable or failing for unrelated reasons, report that explicitly.

Use `flutter doctor -v` to locate the Java binary when `keytool` is not on PATH.

## App Identity Checks

Review:

```text
android/app/src/main/AndroidManifest.xml
android/app/build.gradle.kts or android/app/build.gradle
pubspec.yaml
```

Check:

- App launcher label is final.
- Required permissions are present, such as internet permission only when needed.
- `applicationId` is unique and final before Play Store upload.
- If `applicationId` and `namespace` change, update `MainActivity` package declaration and directory path.
- Version in `pubspec.yaml` follows `version: 1.0.0+1` style.

Do not change `applicationId` casually after a Play Store upload. It is the app's unique Play identity.

## Signing

For Play Store publishing, configure upload key signing.

If no keystore exists, create one using the OS-specific commands in `references/os-command-guide.md`.

Then create:

```text
android/key.properties
```

With:

```properties
storePassword=<password>
keyPassword=<password>
keyAlias=upload
storeFile=<absolute-or-relative-keystore-path>
```

Rules:

- Keep the keystore private.
- Keep `android/key.properties` private.
- Ensure `android/key.properties` is ignored by version control.
- On Windows, escape backslashes in `storeFile` as double backslashes when using a Windows path.

Configure Gradle signing according to the current DSL. Read `references/signing-and-gradle.md` before editing.

## Build Commands

AAB for Google Play:

```text
flutter build appbundle
```

Output:

```text
build/app/outputs/bundle/release/app.aab
```

APK for direct distribution:

```text
flutter build apk --split-per-abi
```

The split APK output directory is:

```text
build/app/outputs/flutter-apk/
```

Use a fat APK only when broad sideload compatibility matters more than file size:

```text
flutter build apk
```

Install a built APK on a connected Android device:

```text
flutter install
```

## OS-Specific Command Rule

Choose command syntax based on the host OS:

Windows PowerShell:

- Use `$env:USERPROFILE`.
- Use backtick line continuation.
- Use `.\` for local scripts/executables when needed.
- Escape backslashes in `key.properties` `storeFile` paths.

macOS/Linux shell:

- Use `~` or `$HOME`.
- Use backslash line continuation.
- Use `./` for local scripts/executables.

Never give a Bash-only command as the only path when the user is on Windows.

## Gradle DSL Rule

Before editing signing config, inspect which file exists:

```text
android/app/build.gradle.kts
android/app/build.gradle
```

Use Kotlin DSL snippets only for `.gradle.kts`.
Use Groovy snippets only for `.gradle`.

Do not mix syntax.

## R8 and Multidex

R8 code shrinking is part of release builds. If build behavior depends on shrinking or obfuscation, verify against the current official docs before recommending flags.

For multidex:

- If the Flutter tool prompts to enable multidex, accepting the prompt is the simplest path.
- Multidex is natively included when targeting Android SDK 21 or later.
- If manually configuring multidex, preserve Flutter startup classes listed by the official docs.

## Output Report

When completing a build task, report:

```text
## Android Release Build

Host OS: Windows/macOS/Linux
Project root: [path]
Artifact: AAB/APK/split APK
Signing: configured / already configured / not configured
Version: x.y.z+build
Commands run:
- ...
Output:
- [artifact path]
Validation:
- flutter analyze: pass/fail/not run
- flutter test: pass/fail/not run
Notes:
- [risks or next steps]
```

## Safety Rules

- Do not print keystore passwords in final responses.
- Do not commit `android/key.properties`.
- Do not commit `.jks` keystore files.
- Do not overwrite existing keystores.
- Do not change `applicationId` without explicit confirmation if the app may already exist in Play Console.
- Do not upload to Play Store unless the user explicitly asks and the required tool/account is available.

## Review Checklist

- OS-specific commands match the host OS.
- Project root is correct.
- Signing config matches Gradle DSL.
- `key.properties` is private and ignored.
- App ID and namespace are reviewed.
- Manifest label and permissions are reviewed.
- Version is set in `pubspec.yaml` or CLI override is explicit.
- AAB is used for Play Store unless user needs APK.
- APK builds use `--split-per-abi` unless a fat APK is intentionally needed.
- Output path is reported.
