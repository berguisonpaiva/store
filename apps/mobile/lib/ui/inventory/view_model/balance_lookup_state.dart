import 'package:equatable/equatable.dart';

import '../../../domain/inventory/entities/stock_balance_entity.dart';

enum BalanceLookupStatus { idle, loading, loaded, notFound, error }

class BalanceLookupState extends Equatable {
  const BalanceLookupState({
    this.status = BalanceLookupStatus.idle,
    this.balance,
    this.errorCode,
  });

  final BalanceLookupStatus status;
  final StockBalanceEntity? balance;
  final String? errorCode;

  bool get isLoading => status == BalanceLookupStatus.loading;

  @override
  List<Object?> get props => [status, balance, errorCode];
}
