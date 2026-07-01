import 'package:flutter/material.dart';

/// Typography tweaks layered on top of the Material 3 defaults.
abstract final class AppTypography {
  static TextTheme apply(TextTheme base) {
    return base.copyWith(
      titleLarge: base.titleLarge?.copyWith(fontWeight: FontWeight.w600),
      labelLarge: base.labelLarge?.copyWith(fontWeight: FontWeight.w600),
    );
  }
}
