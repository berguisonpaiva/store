import 'package:equatable/equatable.dart';

enum StockMovementStatus { idle, submitting, success, failure }

class StockMovementState extends Equatable {
  const StockMovementState({
    this.status = StockMovementStatus.idle,
    this.errorCode,
  });

  final StockMovementStatus status;
  final String? errorCode;

  bool get isSubmitting => status == StockMovementStatus.submitting;

  @override
  List<Object?> get props => [status, errorCode];
}
