import 'dart:async';

import 'package:flutter/foundation.dart';

/// Bridges a [Stream] to a [Listenable] so GoRouter can re-evaluate `redirect`
/// whenever the source (e.g. the auth session cubit) emits.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
      (_) => notifyListeners(),
    );
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
