import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app/di/injector.dart';
import 'package:mobile/ui/home/home_page.dart';
import 'package:mobile/ui/home/view_model/home_cubit.dart';

import 'helpers/pump_app.dart';

void main() {
  setUp(() {
    getIt.registerFactory(HomeCubit.new);
  });

  tearDown(() => getIt.reset());

  testWidgets('HomePage renders and increments via the primary button', (
    tester,
  ) async {
    await tester.pumpWidget(pumpApp(const HomePage()));

    expect(find.text('0'), findsOneWidget);

    await tester.tap(find.text('Increment'));
    await tester.pump();

    expect(find.text('1'), findsOneWidget);
  });
}
