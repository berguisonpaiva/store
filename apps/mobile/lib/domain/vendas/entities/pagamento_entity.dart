import 'package:equatable/equatable.dart';

import 'forma_pagamento.dart';

/// A single payment recorded against a sale on finalization.
///
/// [valorCents] is an integer amount in cents.
class PagamentoEntity extends Equatable {
  const PagamentoEntity({
    required this.id,
    required this.forma,
    required this.valorCents,
  });

  final String id;
  final FormaPagamento forma;
  final int valorCents;

  @override
  List<Object?> get props => [id, forma, valorCents];
}
