import 'package:equatable/equatable.dart';

import 'canal_venda.dart';
import 'item_venda_entity.dart';
import 'pagamento_entity.dart';
import 'status_venda.dart';

/// A PDV counter sale.
///
/// Monetary fields ([subtotalCents], [descontoCents], [totalCents]) are integer
/// amounts in cents; the `/vendas` API speaks cents directly. Formatting to a
/// currency string happens only in the UI layer.
class VendaEntity extends Equatable {
  const VendaEntity({
    required this.id,
    required this.canal,
    required this.status,
    required this.usuarioId,
    required this.sessaoCaixaId,
    required this.subtotalCents,
    required this.descontoCents,
    required this.totalCents,
    this.numero,
    this.itens = const [],
    this.pagamentos = const [],
  });

  final String id;

  /// Human-facing sale number; null until finalized in some backends.
  final int? numero;
  final CanalVenda canal;
  final StatusVenda status;
  final String usuarioId;
  final String sessaoCaixaId;

  final int subtotalCents;
  final int descontoCents;
  final int totalCents;

  final List<ItemVendaEntity> itens;
  final List<PagamentoEntity> pagamentos;

  bool get isOpen => status == StatusVenda.aberta;
  bool get isFinalized => status == StatusVenda.concluida;
  bool get isCancelled => status == StatusVenda.cancelada;

  /// Read-only once the sale is no longer open.
  bool get isReadOnly => !isOpen;

  @override
  List<Object?> get props => [
    id,
    numero,
    canal,
    status,
    usuarioId,
    sessaoCaixaId,
    subtotalCents,
    descontoCents,
    totalCents,
    itens,
    pagamentos,
  ];
}
