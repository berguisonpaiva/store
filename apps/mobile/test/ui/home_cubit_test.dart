import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/ui/home/view_model/home_cubit.dart';
import 'package:mobile/ui/home/view_model/home_state.dart';

void main() {
  group('HomeCubit', () {
    test('starts at zero', () {
      expect(HomeCubit().state, const HomeState());
    });

    blocTest<HomeCubit, HomeState>(
      'emits incremented counter on increment()',
      build: HomeCubit.new,
      act: (cubit) => cubit.increment(),
      expect: () => const [HomeState(counter: 1)],
    );
  });
}
