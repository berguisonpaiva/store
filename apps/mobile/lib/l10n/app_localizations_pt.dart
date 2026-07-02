// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get appTitle => 'Store';

  @override
  String get loginTitle => 'Entrar';

  @override
  String get loginSubtitle => 'Acesse com seu email e senha.';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginPasswordLabel => 'Senha';

  @override
  String get loginEmailRequired => 'Informe o email.';

  @override
  String get loginEmailInvalid => 'Email inválido.';

  @override
  String get loginPasswordRequired => 'Informe a senha.';

  @override
  String get loginSubmit => 'Entrar';

  @override
  String get loginInvalidCredentials => 'Email ou senha inválidos.';

  @override
  String get logout => 'Sair';

  @override
  String get inventoryTitle => 'Estoque';

  @override
  String get inventoryMenuSubtitle =>
      'Consulte saldos e registre movimentações.';

  @override
  String get inventoryBalanceTitle => 'Consultar saldo';

  @override
  String get inventoryMovementsTitle => 'Histórico de movimentações';

  @override
  String get inventoryLowStockTitle => 'Alertas de baixo estoque';

  @override
  String get inventoryEntryTitle => 'Entrada de estoque';

  @override
  String get inventoryExitTitle => 'Saída manual';

  @override
  String get inventoryAdjustmentTitle => 'Ajustar saldo';

  @override
  String get inventoryVariationIdLabel => 'ID da variação';

  @override
  String get inventoryVariationIdRequired => 'Informe o ID da variação.';

  @override
  String get inventoryQuantityLabel => 'Quantidade';

  @override
  String get inventoryQuantityRequired => 'Informe a quantidade.';

  @override
  String get inventoryQuantityInvalid =>
      'A quantidade deve ser maior que zero.';

  @override
  String get inventoryReasonLabel => 'Motivo';

  @override
  String get inventoryObservationLabel => 'Observação (opcional)';

  @override
  String get inventoryNewBalanceLabel => 'Novo saldo';

  @override
  String get inventoryNewBalanceRequired => 'Informe o novo saldo.';

  @override
  String get inventoryNewBalanceInvalid => 'O saldo não pode ser negativo.';

  @override
  String get inventoryJustificationLabel => 'Justificativa';

  @override
  String get inventoryJustificationRequired => 'A justificativa é obrigatória.';

  @override
  String get inventoryLookupAction => 'Consultar';

  @override
  String get inventorySubmitAction => 'Salvar';

  @override
  String get inventoryRefresh => 'Atualizar';

  @override
  String get inventoryCurrentBalance => 'Saldo atual';

  @override
  String get inventoryMinimum => 'Mínimo';

  @override
  String get inventoryBelowMinimumBadge => 'Abaixo do mínimo';

  @override
  String get inventoryTypeEntrada => 'Entrada';

  @override
  String get inventoryTypeSaida => 'Saída';

  @override
  String get inventoryReasonCompra => 'Compra';

  @override
  String get inventoryReasonDevolucao => 'Devolução';

  @override
  String get inventoryReasonAjuste => 'Ajuste';

  @override
  String get inventoryReasonPerda => 'Perda';

  @override
  String get inventoryReasonVenda => 'Venda';

  @override
  String get inventoryPeriodFrom => 'De';

  @override
  String get inventoryPeriodTo => 'Até';

  @override
  String get inventoryApplyFilter => 'Aplicar';

  @override
  String get inventoryClearFilter => 'Limpar';

  @override
  String inventoryResultingBalance(int balance) {
    return 'Saldo resultante: $balance';
  }

  @override
  String get inventoryEmptyMovements => 'Nenhuma movimentação no período.';

  @override
  String get inventoryEmptyLowStock => 'Nenhum alerta de reposição.';

  @override
  String get inventoryLookupHint =>
      'Informe um ID de variação para ver o saldo.';

  @override
  String get inventorySaved => 'Movimentação salva.';

  @override
  String get inventoryErrorVariationNotFound => 'Variação não encontrada.';

  @override
  String get inventoryErrorInsufficientStock => 'Estoque insuficiente.';

  @override
  String get inventoryErrorInvalidQuantity => 'Quantidade inválida.';

  @override
  String get inventoryErrorNetwork => 'Erro de rede. Tente novamente.';

  @override
  String get catalogTitle => 'Catálogo';

  @override
  String get catalogSearchLabel => 'Buscar por nome';

  @override
  String get catalogCategoryFilter => 'Categoria';

  @override
  String get catalogAllCategories => 'Todas as categorias';

  @override
  String get catalogStatusFilter => 'Status';

  @override
  String get catalogStatusAll => 'Todos';

  @override
  String get catalogStatusActive => 'Ativos';

  @override
  String get catalogStatusInactive => 'Inativos';

  @override
  String get catalogEmpty => 'Nenhum produto encontrado.';

  @override
  String catalogVariationCount(int count) {
    return '$count variações';
  }

  @override
  String get catalogInactiveBadge => 'Inativo';

  @override
  String catalogBarcodeLabel(String barcode) {
    return 'Código de barras: $barcode';
  }

  @override
  String get catalogProductTitle => 'Produto';

  @override
  String get catalogVariationsTitle => 'Variações';

  @override
  String get catalogLookupTitle => 'Consulta de variação';

  @override
  String get catalogLookupModeBarcode => 'Código de barras';

  @override
  String get catalogLookupModeSku => 'SKU';

  @override
  String get catalogLookupCodeLabel => 'Digite ou escaneie um código';

  @override
  String get catalogLookupAction => 'Consultar';

  @override
  String get catalogLookupHint =>
      'Informe um SKU ou código de barras para localizar a variação.';

  @override
  String get catalogErrorProductNotFound => 'Produto não encontrado.';

  @override
  String get catalogErrorVariationNotFound => 'Variação não encontrada.';

  @override
  String get catalogErrorNetwork => 'Erro de rede. Tente novamente.';

  @override
  String get caixaTitle => 'Caixa';

  @override
  String get caixaStatusLoading => 'Verificando o caixa...';

  @override
  String get caixaNoSessionTitle => 'Nenhum caixa aberto';

  @override
  String get caixaNoSessionMessage => 'Abra o caixa para iniciar o dia.';

  @override
  String get caixaOpenAction => 'Abrir caixa';

  @override
  String get caixaOpenTitle => 'Abrir caixa';

  @override
  String get caixaOpeningAmountLabel => 'Valor de abertura';

  @override
  String get caixaOpeningAmountRequired => 'Informe o valor de abertura.';

  @override
  String get caixaOpeningAmountInvalid => 'O valor não pode ser negativo.';

  @override
  String get caixaOpenedToast => 'Caixa aberto.';

  @override
  String get caixaActiveTitle => 'Caixa aberto';

  @override
  String get caixaSummaryTitle => 'Resumo';

  @override
  String get caixaSummaryOpening => 'Abertura';

  @override
  String get caixaSummarySupplies => 'Suprimentos';

  @override
  String get caixaSummaryCashSales => 'Vendas em dinheiro';

  @override
  String get caixaSummaryWithdrawals => 'Sangrias';

  @override
  String get caixaSummaryExpected => 'Esperado';

  @override
  String get caixaSummaryCounted => 'Contado';

  @override
  String get caixaSummaryDivergence => 'Divergência';

  @override
  String get caixaMovementsTitle => 'Movimentações';

  @override
  String get caixaEmptyMovements => 'Nenhuma movimentação ainda.';

  @override
  String get caixaWithdrawalAction => 'Sangria';

  @override
  String get caixaSupplyAction => 'Suprimento';

  @override
  String get caixaCloseAction => 'Fechar caixa';

  @override
  String get caixaWithdrawalTitle => 'Registrar sangria';

  @override
  String get caixaSupplyTitle => 'Registrar suprimento';

  @override
  String get caixaAmountLabel => 'Valor';

  @override
  String get caixaAmountRequired => 'Informe o valor.';

  @override
  String get caixaAmountInvalid => 'O valor deve ser maior que zero.';

  @override
  String get caixaObservationLabel => 'Observação';

  @override
  String get caixaObservationRequired => 'A observação é obrigatória.';

  @override
  String get caixaWithdrawalToast => 'Sangria registrada.';

  @override
  String get caixaSupplyToast => 'Suprimento registrado.';

  @override
  String get caixaCloseTitle => 'Fechar caixa';

  @override
  String get caixaCountedAmountLabel => 'Valor contado';

  @override
  String get caixaCountedAmountRequired => 'Informe o valor contado.';

  @override
  String get caixaCountedAmountInvalid => 'O valor não pode ser negativo.';

  @override
  String get caixaDivergenceSurplus => 'Sobra';

  @override
  String get caixaDivergenceShortage => 'Falta';

  @override
  String get caixaDivergenceNone => 'Sem divergência';

  @override
  String get caixaCloseConfirmTitle => 'Fechar o caixa?';

  @override
  String get caixaCloseConfirmMessage =>
      'Esta ação não pode ser desfeita. Confirme o valor contado e a divergência antes de fechar.';

  @override
  String get caixaCloseConfirmAction => 'Confirmar e fechar';

  @override
  String get caixaCancelAction => 'Cancelar';

  @override
  String get caixaClosedToast => 'Caixa fechado.';

  @override
  String get caixaSubmitAction => 'Salvar';

  @override
  String get caixaRefresh => 'Atualizar';

  @override
  String get caixaTypeAbertura => 'Abertura';

  @override
  String get caixaTypeSuprimento => 'Suprimento';

  @override
  String get caixaTypeSangria => 'Sangria';

  @override
  String get caixaTypeVenda => 'Venda';

  @override
  String get caixaTypeDesconhecido => 'Outro';

  @override
  String get caixaErrorAlreadyOpen => 'Já existe um caixa aberto.';

  @override
  String get caixaErrorNotFound => 'Caixa não encontrado.';

  @override
  String get caixaErrorAlreadyClosed => 'Este caixa já está fechado.';

  @override
  String get caixaErrorPendingSale =>
      'Há uma venda pendente; finalize-a antes de fechar.';

  @override
  String get caixaErrorInvalidAmount => 'Valor inválido.';

  @override
  String get caixaErrorNetwork => 'Erro de rede. Tente novamente.';

  @override
  String get caixaErrorAccessDenied => 'Você não tem acesso a este caixa.';

  @override
  String get caixaHistoryTitle => 'Histórico de caixas';

  @override
  String get caixaHistoryEmpty => 'Nenhuma sessão de caixa encontrada.';

  @override
  String get caixaHistoryFilterAll => 'Todas';

  @override
  String get caixaStatusOpenLabel => 'Aberto';

  @override
  String get caixaStatusClosedLabel => 'Fechado';

  @override
  String get caixaHistoryDetailTitle => 'Detalhe do caixa';

  @override
  String get caixaDetailSessionTitle => 'Sessão';

  @override
  String get caixaDetailOpenedAt => 'Aberto em';

  @override
  String get caixaDetailClosedAt => 'Fechado em';

  @override
  String get caixaDetailClosingAmount => 'Valor de fechamento';

  @override
  String get caixaAlreadyOpenTitle => 'Caixa já aberto';

  @override
  String get caixaAlreadyOpenMessage =>
      'Você já possui um caixa aberto. Feche-o antes de abrir outro.';

  @override
  String get caixaGoToSessionAction => 'Ir para o caixa aberto';

  @override
  String get caixaPendingSaleTitle => 'Venda pendente';

  @override
  String get caixaPendingSaleMessage =>
      'Há uma venda aberta nesta sessão. Finalize ou cancele a venda antes de fechar o caixa.';

  @override
  String get caixaGoToPendingSaleAction => 'Ir para a venda';

  @override
  String get vendasTitle => 'Venda';

  @override
  String get vendasPdvTitle => 'Venda no balcão';

  @override
  String get vendasStarting => 'Iniciando a venda...';

  @override
  String get vendasBipLabel => 'Bipe ou digite um código';

  @override
  String get vendasBipModeBarcode => 'Código de barras';

  @override
  String get vendasBipModeSku => 'SKU';

  @override
  String get vendasAddAction => 'Adicionar';

  @override
  String get vendasEmptyItems =>
      'Nenhum item ainda. Bipe um produto para começar.';

  @override
  String vendasItemQuantity(int quantity) {
    return 'Qtd $quantity';
  }

  @override
  String get vendasRemoveItem => 'Remover item';

  @override
  String get vendasRemoveItemConfirmTitle => 'Remover item?';

  @override
  String get vendasRemoveItemConfirmMessage =>
      'Este item será removido da venda.';

  @override
  String get vendasRemoveItemConfirmAction => 'Remover';

  @override
  String get vendasSubtotal => 'Subtotal';

  @override
  String get vendasDiscount => 'Desconto';

  @override
  String get vendasTotal => 'Total';

  @override
  String get vendasDiscountAction => 'Desconto';

  @override
  String get vendasDiscountTitle => 'Aplicar desconto';

  @override
  String get vendasDiscountModeValue => 'Valor';

  @override
  String get vendasDiscountModePercent => 'Percentual';

  @override
  String get vendasDiscountValueLabel => 'Valor do desconto';

  @override
  String get vendasDiscountValueRequired => 'Informe o valor do desconto.';

  @override
  String get vendasDiscountValueInvalid => 'Valor de desconto inválido.';

  @override
  String get vendasDiscountExceedsSubtotal =>
      'O desconto não pode ser maior que o subtotal.';

  @override
  String get vendasDiscountApplied => 'Desconto aplicado.';

  @override
  String get vendasFinalizeAction => 'Finalizar venda';

  @override
  String get vendasFinalizeTitle => 'Pagamento';

  @override
  String get vendasPaymentFormLabel => 'Forma de pagamento';

  @override
  String get vendasPaymentAmountLabel => 'Valor';

  @override
  String get vendasPaymentAddAction => 'Adicionar pagamento';

  @override
  String get vendasPaymentRemove => 'Remover pagamento';

  @override
  String get vendasPaymentsTotal => 'Pagamentos';

  @override
  String get vendasRemaining => 'Restante';

  @override
  String get vendasFinalizeConfirm => 'Confirmar pagamento';

  @override
  String get vendasFinalizeBlocked =>
      'Os pagamentos devem somar o total para finalizar.';

  @override
  String get vendasFinalizedToast => 'Venda finalizada.';

  @override
  String get vendasCancelAction => 'Cancelar venda';

  @override
  String get vendasCancelConfirmTitle => 'Cancelar venda?';

  @override
  String get vendasCancelConfirmMessage =>
      'Esta ação não pode ser desfeita e reverte a venda.';

  @override
  String get vendasCancelConfirmAction => 'Cancelar venda';

  @override
  String get vendasKeepEditing => 'Continuar editando';

  @override
  String get vendasCancelledToast => 'Venda cancelada.';

  @override
  String get vendasReadOnlyBanner =>
      'Esta venda foi finalizada e está somente leitura.';

  @override
  String get vendasStatusAberta => 'Aberta';

  @override
  String get vendasStatusConcluida => 'Concluída';

  @override
  String get vendasStatusCancelada => 'Cancelada';

  @override
  String get vendasPaymentDinheiro => 'Dinheiro';

  @override
  String get vendasPaymentCartaoDebito => 'Cartão de débito';

  @override
  String get vendasPaymentCartaoCredito => 'Cartão de crédito';

  @override
  String get vendasPaymentPix => 'Pix';

  @override
  String get vendasNoSessionTitle => 'Nenhum caixa aberto';

  @override
  String get vendasNoSessionMessage => 'Abra o caixa antes de vender.';

  @override
  String get vendasOpenCashAction => 'Abrir caixa';

  @override
  String get vendasErrorNotFound => 'Venda não encontrada.';

  @override
  String get vendasErrorAlreadyFinalized => 'Esta venda já foi finalizada.';

  @override
  String get vendasErrorNoOpenCashSession => 'Não há caixa aberto.';

  @override
  String get vendasErrorInsufficientStock =>
      'Estoque insuficiente para um dos itens.';

  @override
  String get vendasErrorPaymentMismatch =>
      'Os pagamentos não conferem com o total da venda.';

  @override
  String get vendasErrorInvalidInput => 'Valor inválido.';

  @override
  String get vendasErrorNetwork => 'Erro de rede. Tente novamente.';

  @override
  String get vendasHistoryTitle => 'Minhas vendas';

  @override
  String get vendasHistoryEmpty => 'Nenhuma venda encontrada.';

  @override
  String get vendasHistoryFilterAll => 'Todas';

  @override
  String vendasHistoryNumber(int numero) {
    return 'Venda #$numero';
  }

  @override
  String vendasHistoryItemsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count itens',
      one: '1 item',
      zero: 'Nenhum item',
    );
    return '$_temp0';
  }

  @override
  String get vendasHistoryDetailTitle => 'Detalhe da venda';

  @override
  String get vendasHistoryItemsSection => 'Itens';

  @override
  String get vendasHistoryPaymentsSection => 'Pagamentos';
}
