import 'package:flutter/material.dart';
import 'package:mobile/l10n/app_localizations.dart';

/// Wraps a widget in a minimal localized [MaterialApp] for widget tests.
Widget pumpApp(Widget child) {
  return MaterialApp(
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: child,
  );
}
