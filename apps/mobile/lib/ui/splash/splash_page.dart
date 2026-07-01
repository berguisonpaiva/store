import 'package:flutter/material.dart';

/// Neutral screen shown while the persisted session is being restored
/// (`AuthStatus.unknown`).
class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
