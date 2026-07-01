import 'package:equatable/equatable.dart';

enum LoginStatus { idle, submitting, success, failure }

class LoginState extends Equatable {
  const LoginState({this.status = LoginStatus.idle, this.errorCode});

  final LoginStatus status;
  final String? errorCode;

  bool get isSubmitting => status == LoginStatus.submitting;

  LoginState copyWith({LoginStatus? status, String? errorCode}) => LoginState(
    status: status ?? this.status,
    errorCode: errorCode,
  );

  @override
  List<Object?> get props => [status, errorCode];
}
