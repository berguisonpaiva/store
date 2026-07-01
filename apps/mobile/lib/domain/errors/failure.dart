import 'package:equatable/equatable.dart';

/// Base business/app-level error the UI can interpret and localize.
///
/// Failures never contain translated UI text — only a stable [code] and an
/// optional developer-facing [message].
abstract class Failure extends Equatable {
  const Failure(this.code, {this.message});

  final String code;
  final String? message;

  @override
  List<Object?> get props => [code, message];
}

/// Unexpected failure that does not map to a known business case.
class UnexpectedFailure extends Failure {
  const UnexpectedFailure({String? message})
    : super('unexpected', message: message);
}
