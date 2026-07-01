# Android Release Checklist

## Environment

- `flutter doctor -v` reviewed.
- `flutter pub get` completed.
- `flutter analyze` passed or failures documented.
- `flutter test` passed or failures documented.
- Commands match host OS syntax.

## App Identity

- `applicationId` is unique.
- `namespace` is consistent with package structure.
- `MainActivity` package declaration and path match if app ID changed.
- Launcher label is final.
- Required permissions are present and unnecessary permissions are absent.

## Version

- `pubspec.yaml` has correct `version: x.y.z+build`.
- If using `--build-name` or `--build-number`, the override is explicit.
- Version name/build number are suitable for Play Console.

## Signing

- Upload keystore exists or was intentionally created.
- `android/key.properties` exists when release signing is required.
- `key.properties` is ignored by version control.
- Keystore is not committed.
- Gradle signing config uses release signing, not debug signing.
- Gradle syntax matches `.gradle.kts` or `.gradle`.

## Build Configuration

- `compileSdk`, `minSdk`, and `targetSdk` use Flutter defaults unless there is a clear plugin/product reason to override.
- Multidex need is understood if min SDK is 20 or lower or build prompts for it.
- R8/shrinking behavior is understood for release builds.

## Artifact

- Play Store release uses AAB: `flutter build appbundle`.
- Direct APK distribution uses `flutter build apk --split-per-abi` unless a fat APK is intentionally needed.
- Output path is reported.
- Artifact is signed when required.

## Safety

- No secrets printed.
- No signing file overwritten without confirmation.
- No Play upload performed without explicit request.
