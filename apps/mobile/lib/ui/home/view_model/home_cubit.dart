import 'package:bloc/bloc.dart';

import 'home_state.dart';

/// Home ViewModel. Pure Dart (no Flutter imports) so it is unit-testable.
class HomeCubit extends Cubit<HomeState> {
  HomeCubit() : super(const HomeState());

  void increment() => emit(state.copyWith(counter: state.counter + 1));
}
