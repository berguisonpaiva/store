// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Store';

  @override
  String get loginTitle => 'Sign in';

  @override
  String get loginSubtitle => 'Use your email and password.';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginPasswordLabel => 'Password';

  @override
  String get loginEmailRequired => 'Enter your email.';

  @override
  String get loginEmailInvalid => 'Invalid email.';

  @override
  String get loginPasswordRequired => 'Enter your password.';

  @override
  String get loginSubmit => 'Sign in';

  @override
  String get loginInvalidCredentials => 'Invalid email or password.';

  @override
  String get logout => 'Sign out';

  @override
  String get inventoryTitle => 'Inventory';

  @override
  String get inventoryMenuSubtitle =>
      'Check balances and register stock movements.';

  @override
  String get inventoryBalanceTitle => 'Check balance';

  @override
  String get inventoryMovementsTitle => 'Movement history';

  @override
  String get inventoryLowStockTitle => 'Low stock alerts';

  @override
  String get inventoryEntryTitle => 'Stock entry';

  @override
  String get inventoryExitTitle => 'Manual exit';

  @override
  String get inventoryAdjustmentTitle => 'Adjust balance';

  @override
  String get inventoryVariationIdLabel => 'Variation ID';

  @override
  String get inventoryVariationIdRequired => 'Enter the variation ID.';

  @override
  String get inventoryQuantityLabel => 'Quantity';

  @override
  String get inventoryQuantityRequired => 'Enter the quantity.';

  @override
  String get inventoryQuantityInvalid => 'Quantity must be greater than zero.';

  @override
  String get inventoryReasonLabel => 'Reason';

  @override
  String get inventoryObservationLabel => 'Note (optional)';

  @override
  String get inventoryNewBalanceLabel => 'New balance';

  @override
  String get inventoryNewBalanceRequired => 'Enter the new balance.';

  @override
  String get inventoryNewBalanceInvalid => 'Balance cannot be negative.';

  @override
  String get inventoryJustificationLabel => 'Justification';

  @override
  String get inventoryJustificationRequired => 'A justification is required.';

  @override
  String get inventoryLookupAction => 'Look up';

  @override
  String get inventorySubmitAction => 'Save';

  @override
  String get inventoryRefresh => 'Refresh';

  @override
  String get inventoryCurrentBalance => 'Current balance';

  @override
  String get inventoryAvailableBalance => 'Available';

  @override
  String get inventoryReserved => 'Reserved';

  @override
  String get inventoryMinimum => 'Minimum';

  @override
  String get inventoryBelowMinimumBadge => 'Below minimum';

  @override
  String get inventoryTypeEntrada => 'Entry';

  @override
  String get inventoryTypeSaida => 'Exit';

  @override
  String get inventoryReasonCompra => 'Purchase';

  @override
  String get inventoryReasonDevolucao => 'Return';

  @override
  String get inventoryReasonAjuste => 'Adjustment';

  @override
  String get inventoryReasonPerda => 'Loss';

  @override
  String get inventoryReasonVenda => 'Sale';

  @override
  String get inventoryPeriodFrom => 'From';

  @override
  String get inventoryPeriodTo => 'To';

  @override
  String get inventoryApplyFilter => 'Apply';

  @override
  String get inventoryClearFilter => 'Clear';

  @override
  String inventoryResultingBalance(int balance) {
    return 'Resulting balance: $balance';
  }

  @override
  String get inventoryEmptyMovements => 'No movements for this period.';

  @override
  String get inventoryEmptyLowStock => 'No replenishment alerts.';

  @override
  String get inventoryLookupHint => 'Enter a variation ID to see its balance.';

  @override
  String get inventorySaved => 'Movement saved.';

  @override
  String get inventoryErrorVariationNotFound => 'Variation not found.';

  @override
  String get inventoryErrorInsufficientStock => 'Insufficient stock.';

  @override
  String get inventoryErrorInvalidQuantity => 'Invalid quantity.';

  @override
  String get inventoryErrorNetwork => 'Network error. Please try again.';

  @override
  String get catalogTitle => 'Catalog';

  @override
  String get catalogSearchLabel => 'Search by name';

  @override
  String get catalogCategoryFilter => 'Category';

  @override
  String get catalogAllCategories => 'All categories';

  @override
  String get catalogStatusFilter => 'Status';

  @override
  String get catalogStatusAll => 'All';

  @override
  String get catalogStatusActive => 'Active';

  @override
  String get catalogStatusInactive => 'Inactive';

  @override
  String get catalogEmpty => 'No products found.';

  @override
  String catalogVariationCount(int count) {
    return '$count variations';
  }

  @override
  String get catalogInactiveBadge => 'Inactive';

  @override
  String catalogBarcodeLabel(String barcode) {
    return 'Barcode: $barcode';
  }

  @override
  String get catalogProductTitle => 'Product';

  @override
  String get catalogVariationsTitle => 'Variations';

  @override
  String get catalogLookupTitle => 'Variation lookup';

  @override
  String get catalogLookupModeBarcode => 'Barcode';

  @override
  String get catalogLookupModeSku => 'SKU';

  @override
  String get catalogLookupCodeLabel => 'Enter or scan a code';

  @override
  String get catalogLookupAction => 'Look up';

  @override
  String get catalogLookupHint =>
      'Enter a SKU or barcode to resolve a variation.';

  @override
  String get catalogErrorProductNotFound => 'Product not found.';

  @override
  String get catalogErrorVariationNotFound => 'Variation not found.';

  @override
  String get catalogErrorNetwork => 'Network error. Please try again.';

  @override
  String get caixaTitle => 'Cash register';

  @override
  String get caixaStatusLoading => 'Checking the cash register...';

  @override
  String get caixaNoSessionTitle => 'No open cash register';

  @override
  String get caixaNoSessionMessage =>
      'Open the cash register to start the day.';

  @override
  String get caixaOpenAction => 'Open cash register';

  @override
  String get caixaOpenTitle => 'Open cash register';

  @override
  String get caixaOpeningAmountLabel => 'Opening amount';

  @override
  String get caixaOpeningAmountRequired => 'Enter the opening amount.';

  @override
  String get caixaOpeningAmountInvalid => 'Amount cannot be negative.';

  @override
  String get caixaOpenedToast => 'Cash register opened.';

  @override
  String get caixaActiveTitle => 'Active cash register';

  @override
  String get caixaSummaryTitle => 'Summary';

  @override
  String get caixaSummaryOpening => 'Opening';

  @override
  String get caixaSummarySupplies => 'Supplies';

  @override
  String get caixaSummaryCashSales => 'Cash sales';

  @override
  String get caixaSummaryWithdrawals => 'Withdrawals';

  @override
  String get caixaSummaryExpected => 'Expected';

  @override
  String get caixaSummaryCounted => 'Counted';

  @override
  String get caixaSummaryDivergence => 'Divergence';

  @override
  String get caixaMovementsTitle => 'Movements';

  @override
  String get caixaEmptyMovements => 'No movements yet.';

  @override
  String get caixaWithdrawalAction => 'Withdrawal';

  @override
  String get caixaSupplyAction => 'Supply';

  @override
  String get caixaCloseAction => 'Close cash register';

  @override
  String get caixaWithdrawalTitle => 'Register withdrawal';

  @override
  String get caixaSupplyTitle => 'Register supply';

  @override
  String get caixaAmountLabel => 'Amount';

  @override
  String get caixaAmountRequired => 'Enter the amount.';

  @override
  String get caixaAmountInvalid => 'Amount must be greater than zero.';

  @override
  String get caixaObservationLabel => 'Note';

  @override
  String get caixaObservationRequired => 'A note is required.';

  @override
  String get caixaWithdrawalToast => 'Withdrawal registered.';

  @override
  String get caixaSupplyToast => 'Supply registered.';

  @override
  String get caixaCloseTitle => 'Close cash register';

  @override
  String get caixaCountedAmountLabel => 'Counted amount';

  @override
  String get caixaCountedAmountRequired => 'Enter the counted amount.';

  @override
  String get caixaCountedAmountInvalid => 'Amount cannot be negative.';

  @override
  String get caixaDivergenceSurplus => 'Surplus';

  @override
  String get caixaDivergenceShortage => 'Shortage';

  @override
  String get caixaDivergenceNone => 'No divergence';

  @override
  String get caixaCloseConfirmTitle => 'Close cash register?';

  @override
  String get caixaCloseConfirmMessage =>
      'This action cannot be undone. Confirm the counted amount and divergence before closing.';

  @override
  String get caixaCloseConfirmAction => 'Confirm and close';

  @override
  String get caixaCancelAction => 'Cancel';

  @override
  String get caixaClosedToast => 'Cash register closed.';

  @override
  String get caixaSubmitAction => 'Save';

  @override
  String get caixaRefresh => 'Refresh';

  @override
  String get caixaTypeAbertura => 'Opening';

  @override
  String get caixaTypeSuprimento => 'Supply';

  @override
  String get caixaTypeSangria => 'Withdrawal';

  @override
  String get caixaTypeVendaDinheiro => 'Cash sale';

  @override
  String get caixaTypeFechamento => 'Closing';

  @override
  String get caixaErrorAlreadyOpen => 'There is already an open cash register.';

  @override
  String get caixaErrorNotFound => 'Cash register not found.';

  @override
  String get caixaErrorAlreadyClosed => 'This cash register is already closed.';

  @override
  String get caixaErrorPendingSale =>
      'There is a pending sale; finish it before closing.';

  @override
  String get caixaErrorInvalidAmount => 'Invalid amount.';

  @override
  String get caixaErrorNetwork => 'Network error. Please try again.';

  @override
  String get vendasTitle => 'Sale';

  @override
  String get vendasPdvTitle => 'Counter sale';

  @override
  String get vendasStarting => 'Starting the sale...';

  @override
  String get vendasBipLabel => 'Scan or type a code';

  @override
  String get vendasBipModeBarcode => 'Barcode';

  @override
  String get vendasBipModeSku => 'SKU';

  @override
  String get vendasAddAction => 'Add';

  @override
  String get vendasEmptyItems => 'No items yet. Scan a product to start.';

  @override
  String vendasItemQuantity(int quantity) {
    return 'Qty $quantity';
  }

  @override
  String get vendasRemoveItem => 'Remove item';

  @override
  String get vendasRemoveItemConfirmTitle => 'Remove item?';

  @override
  String get vendasRemoveItemConfirmMessage =>
      'This item will be removed from the sale.';

  @override
  String get vendasRemoveItemConfirmAction => 'Remove';

  @override
  String get vendasSubtotal => 'Subtotal';

  @override
  String get vendasDiscount => 'Discount';

  @override
  String get vendasTotal => 'Total';

  @override
  String get vendasDiscountAction => 'Discount';

  @override
  String get vendasDiscountTitle => 'Apply discount';

  @override
  String get vendasDiscountModeValue => 'Amount';

  @override
  String get vendasDiscountModePercent => 'Percent';

  @override
  String get vendasDiscountValueLabel => 'Discount value';

  @override
  String get vendasDiscountValueRequired => 'Enter the discount value.';

  @override
  String get vendasDiscountValueInvalid => 'Invalid discount value.';

  @override
  String get vendasDiscountExceedsSubtotal =>
      'The discount cannot exceed the subtotal.';

  @override
  String get vendasDiscountApplied => 'Discount applied.';

  @override
  String get vendasFinalizeAction => 'Finalize sale';

  @override
  String get vendasFinalizeTitle => 'Payment';

  @override
  String get vendasPaymentFormLabel => 'Payment method';

  @override
  String get vendasPaymentAmountLabel => 'Amount';

  @override
  String get vendasPaymentAddAction => 'Add payment';

  @override
  String get vendasPaymentRemove => 'Remove payment';

  @override
  String get vendasPaymentsTotal => 'Payments';

  @override
  String get vendasRemaining => 'Remaining';

  @override
  String get vendasFinalizeConfirm => 'Confirm payment';

  @override
  String get vendasFinalizeBlocked =>
      'Payments must equal the total to finalize.';

  @override
  String get vendasFinalizedToast => 'Sale finalized.';

  @override
  String get vendasCancelAction => 'Cancel sale';

  @override
  String get vendasCancelConfirmTitle => 'Cancel sale?';

  @override
  String get vendasCancelConfirmMessage =>
      'This action cannot be undone and reverses the sale.';

  @override
  String get vendasCancelConfirmAction => 'Cancel sale';

  @override
  String get vendasKeepEditing => 'Keep editing';

  @override
  String get vendasCancelledToast => 'Sale cancelled.';

  @override
  String get vendasReadOnlyBanner => 'This sale is finalized and read-only.';

  @override
  String get vendasStatusAberta => 'Open';

  @override
  String get vendasStatusConcluida => 'Finalized';

  @override
  String get vendasStatusCancelada => 'Cancelled';

  @override
  String get vendasPaymentDinheiro => 'Cash';

  @override
  String get vendasPaymentCartaoDebito => 'Debit card';

  @override
  String get vendasPaymentCartaoCredito => 'Credit card';

  @override
  String get vendasPaymentPix => 'Pix';

  @override
  String get vendasNoSessionTitle => 'No open cash register';

  @override
  String get vendasNoSessionMessage => 'Open the cash register before selling.';

  @override
  String get vendasOpenCashAction => 'Open cash register';

  @override
  String get vendasErrorNotFound => 'Sale not found.';

  @override
  String get vendasErrorAlreadyFinalized => 'This sale is already finalized.';

  @override
  String get vendasErrorNoOpenCashSession => 'There is no open cash register.';

  @override
  String get vendasErrorInsufficientStock =>
      'Insufficient stock for one of the items.';

  @override
  String get vendasErrorPaymentMismatch =>
      'Payments do not match the sale total.';

  @override
  String get vendasErrorInvalidInput => 'Invalid value.';

  @override
  String get vendasErrorNetwork => 'Network error. Please try again.';
}
