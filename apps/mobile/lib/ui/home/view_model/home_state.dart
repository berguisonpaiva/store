import 'package:equatable/equatable.dart';

/// State for the home screen example.
class HomeState extends Equatable {
  const HomeState({this.counter = 0});

  final int counter;

  HomeState copyWith({int? counter}) =>
      HomeState(counter: counter ?? this.counter);

  @override
  List<Object?> get props => [counter];
}
