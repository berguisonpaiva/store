import 'package:intl/intl.dart';

import '../../domain/vendas/entities/forma_pagamento.dart';
import '../../domain/vendas/entities/status_venda.dart';
import '../../l10n/app_localizations.dart';

/// Maps sales domain codes/enums to localized, user-facing strings and formats
/// money. Keeps screens free of switch statements.
extension VendasL10n on AppLocalizations {
  String vendasError(String? code) {
    return switch (code) {
      'vendas.not_found' => vendasErrorNotFound,
      'vendas.already_finalized' => vendasErrorAlreadyFinalized,
      'vendas.no_open_cash_session' => vendasErrorNoOpenCashSession,
      'vendas.insufficient_stock' => vendasErrorInsufficientStock,
      'vendas.payment_mismatch' => vendasErrorPaymentMismatch,
      'vendas.invalid_input' => vendasErrorInvalidInput,
      _ => vendasErrorNetwork,
    };
  }

  String vendasFormaPagamento(FormaPagamento forma) => switch (forma) {
    FormaPagamento.dinheiro => vendasPaymentDinheiro,
    FormaPagamento.cartaoDebito => vendasPaymentCartaoDebito,
    FormaPagamento.cartaoCredito => vendasPaymentCartaoCredito,
    FormaPagamento.pix => vendasPaymentPix,
  };

  String vendasStatus(StatusVenda status) => switch (status) {
    StatusVenda.aberta => vendasStatusAberta,
    StatusVenda.concluida => vendasStatusConcluida,
    StatusVenda.cancelada => vendasStatusCancelada,
  };

  /// Formats integer cents to the locale's currency (e.g. 1990 → `R$ 19,90`).
  String formatVendaMoney(int cents) =>
      NumberFormat.simpleCurrency(locale: localeName).format(cents / 100);
}
