# OS Command Guide

Use this file when producing commands for a Flutter Android build.

## Detect Host OS

Windows PowerShell indicators:

- Current shell is PowerShell.
- Paths look like `C:\Users\...`.
- Environment variables use `$env:NAME`.

macOS/Linux shell indicators:

- Paths look like `/Users/...`, `/home/...`, or `~/...`.
- Environment variables use `$NAME`.
- `uname` is available.

## Project Root

All build commands should run from the Flutter project root, the directory containing `pubspec.yaml`.

Windows PowerShell:

```powershell
Set-Location C:\path\to\project
flutter doctor -v
flutter pub get
flutter analyze
flutter test
flutter build appbundle
```

macOS/Linux:

```bash
cd /path/to/project
flutter doctor -v
flutter pub get
flutter analyze
flutter test
flutter build appbundle
```

## Create Upload Keystore

Windows PowerShell:

```powershell
keytool -genkey -v -keystore $env:USERPROFILE\upload-keystore.jks `
  -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 `
  -alias upload
```

macOS/Linux:

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA \
  -storetype JKS -keysize 2048 -validity 10000 -alias upload
```

If `keytool` is not found:

1. Run `flutter doctor -v`.
2. Find the line that contains `Java binary at:`.
3. Use the `keytool` executable from the same Java installation.
4. Quote paths with spaces on Windows, especially under `Program Files`.

## key.properties Path Examples

Windows paths need double backslashes inside `android/key.properties`:

```properties
storeFile=C:\\Users\\your-user\\upload-keystore.jks
```

macOS/Linux:

```properties
storeFile=/Users/your-user/upload-keystore.jks
```

Relative paths may be safer for team environments if the keystore is stored in a secure local path outside version control.

## Build Artifacts

AAB:

```text
flutter build appbundle
build/app/outputs/bundle/release/app.aab
```

Split APKs:

```text
flutter build apk --split-per-abi
build/app/outputs/flutter-apk/
```

Fat APK:

```text
flutter build apk
build/app/outputs/flutter-apk/app-release.apk
```

Install on connected device:

```text
flutter install
```
