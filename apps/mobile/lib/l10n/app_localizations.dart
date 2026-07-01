import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_pt.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('pt'),
  ];

  /// Application title
  ///
  /// In en, this message translates to:
  /// **'Store'**
  String get appTitle;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Use your email and password.'**
  String get loginSubtitle;

  /// No description provided for @loginEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get loginEmailLabel;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get loginPasswordLabel;

  /// No description provided for @loginEmailRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your email.'**
  String get loginEmailRequired;

  /// No description provided for @loginEmailInvalid.
  ///
  /// In en, this message translates to:
  /// **'Invalid email.'**
  String get loginEmailInvalid;

  /// No description provided for @loginPasswordRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your password.'**
  String get loginPasswordRequired;

  /// No description provided for @loginSubmit.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginSubmit;

  /// No description provided for @loginInvalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'Invalid email or password.'**
  String get loginInvalidCredentials;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get logout;

  /// No description provided for @inventoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Inventory'**
  String get inventoryTitle;

  /// No description provided for @inventoryMenuSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Check balances and register stock movements.'**
  String get inventoryMenuSubtitle;

  /// No description provided for @inventoryBalanceTitle.
  ///
  /// In en, this message translates to:
  /// **'Check balance'**
  String get inventoryBalanceTitle;

  /// No description provided for @inventoryMovementsTitle.
  ///
  /// In en, this message translates to:
  /// **'Movement history'**
  String get inventoryMovementsTitle;

  /// No description provided for @inventoryLowStockTitle.
  ///
  /// In en, this message translates to:
  /// **'Low stock alerts'**
  String get inventoryLowStockTitle;

  /// No description provided for @inventoryEntryTitle.
  ///
  /// In en, this message translates to:
  /// **'Stock entry'**
  String get inventoryEntryTitle;

  /// No description provided for @inventoryExitTitle.
  ///
  /// In en, this message translates to:
  /// **'Manual exit'**
  String get inventoryExitTitle;

  /// No description provided for @inventoryAdjustmentTitle.
  ///
  /// In en, this message translates to:
  /// **'Adjust balance'**
  String get inventoryAdjustmentTitle;

  /// No description provided for @inventoryVariationIdLabel.
  ///
  /// In en, this message translates to:
  /// **'Variation ID'**
  String get inventoryVariationIdLabel;

  /// No description provided for @inventoryVariationIdRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the variation ID.'**
  String get inventoryVariationIdRequired;

  /// No description provided for @inventoryQuantityLabel.
  ///
  /// In en, this message translates to:
  /// **'Quantity'**
  String get inventoryQuantityLabel;

  /// No description provided for @inventoryQuantityRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the quantity.'**
  String get inventoryQuantityRequired;

  /// No description provided for @inventoryQuantityInvalid.
  ///
  /// In en, this message translates to:
  /// **'Quantity must be greater than zero.'**
  String get inventoryQuantityInvalid;

  /// No description provided for @inventoryReasonLabel.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get inventoryReasonLabel;

  /// No description provided for @inventoryObservationLabel.
  ///
  /// In en, this message translates to:
  /// **'Note (optional)'**
  String get inventoryObservationLabel;

  /// No description provided for @inventoryNewBalanceLabel.
  ///
  /// In en, this message translates to:
  /// **'New balance'**
  String get inventoryNewBalanceLabel;

  /// No description provided for @inventoryNewBalanceRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the new balance.'**
  String get inventoryNewBalanceRequired;

  /// No description provided for @inventoryNewBalanceInvalid.
  ///
  /// In en, this message translates to:
  /// **'Balance cannot be negative.'**
  String get inventoryNewBalanceInvalid;

  /// No description provided for @inventoryJustificationLabel.
  ///
  /// In en, this message translates to:
  /// **'Justification'**
  String get inventoryJustificationLabel;

  /// No description provided for @inventoryJustificationRequired.
  ///
  /// In en, this message translates to:
  /// **'A justification is required.'**
  String get inventoryJustificationRequired;

  /// No description provided for @inventoryLookupAction.
  ///
  /// In en, this message translates to:
  /// **'Look up'**
  String get inventoryLookupAction;

  /// No description provided for @inventorySubmitAction.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get inventorySubmitAction;

  /// No description provided for @inventoryRefresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get inventoryRefresh;

  /// No description provided for @inventoryCurrentBalance.
  ///
  /// In en, this message translates to:
  /// **'Current balance'**
  String get inventoryCurrentBalance;

  /// No description provided for @inventoryAvailableBalance.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get inventoryAvailableBalance;

  /// No description provided for @inventoryReserved.
  ///
  /// In en, this message translates to:
  /// **'Reserved'**
  String get inventoryReserved;

  /// No description provided for @inventoryMinimum.
  ///
  /// In en, this message translates to:
  /// **'Minimum'**
  String get inventoryMinimum;

  /// No description provided for @inventoryBelowMinimumBadge.
  ///
  /// In en, this message translates to:
  /// **'Below minimum'**
  String get inventoryBelowMinimumBadge;

  /// No description provided for @inventoryTypeEntrada.
  ///
  /// In en, this message translates to:
  /// **'Entry'**
  String get inventoryTypeEntrada;

  /// No description provided for @inventoryTypeSaida.
  ///
  /// In en, this message translates to:
  /// **'Exit'**
  String get inventoryTypeSaida;

  /// No description provided for @inventoryReasonCompra.
  ///
  /// In en, this message translates to:
  /// **'Purchase'**
  String get inventoryReasonCompra;

  /// No description provided for @inventoryReasonDevolucao.
  ///
  /// In en, this message translates to:
  /// **'Return'**
  String get inventoryReasonDevolucao;

  /// No description provided for @inventoryReasonAjuste.
  ///
  /// In en, this message translates to:
  /// **'Adjustment'**
  String get inventoryReasonAjuste;

  /// No description provided for @inventoryReasonPerda.
  ///
  /// In en, this message translates to:
  /// **'Loss'**
  String get inventoryReasonPerda;

  /// No description provided for @inventoryReasonVenda.
  ///
  /// In en, this message translates to:
  /// **'Sale'**
  String get inventoryReasonVenda;

  /// No description provided for @inventoryPeriodFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get inventoryPeriodFrom;

  /// No description provided for @inventoryPeriodTo.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get inventoryPeriodTo;

  /// No description provided for @inventoryApplyFilter.
  ///
  /// In en, this message translates to:
  /// **'Apply'**
  String get inventoryApplyFilter;

  /// No description provided for @inventoryClearFilter.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get inventoryClearFilter;

  /// No description provided for @inventoryResultingBalance.
  ///
  /// In en, this message translates to:
  /// **'Resulting balance: {balance}'**
  String inventoryResultingBalance(int balance);

  /// No description provided for @inventoryEmptyMovements.
  ///
  /// In en, this message translates to:
  /// **'No movements for this period.'**
  String get inventoryEmptyMovements;

  /// No description provided for @inventoryEmptyLowStock.
  ///
  /// In en, this message translates to:
  /// **'No replenishment alerts.'**
  String get inventoryEmptyLowStock;

  /// No description provided for @inventoryLookupHint.
  ///
  /// In en, this message translates to:
  /// **'Enter a variation ID to see its balance.'**
  String get inventoryLookupHint;

  /// No description provided for @inventorySaved.
  ///
  /// In en, this message translates to:
  /// **'Movement saved.'**
  String get inventorySaved;

  /// No description provided for @inventoryErrorVariationNotFound.
  ///
  /// In en, this message translates to:
  /// **'Variation not found.'**
  String get inventoryErrorVariationNotFound;

  /// No description provided for @inventoryErrorInsufficientStock.
  ///
  /// In en, this message translates to:
  /// **'Insufficient stock.'**
  String get inventoryErrorInsufficientStock;

  /// No description provided for @inventoryErrorInvalidQuantity.
  ///
  /// In en, this message translates to:
  /// **'Invalid quantity.'**
  String get inventoryErrorInvalidQuantity;

  /// No description provided for @inventoryErrorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Network error. Please try again.'**
  String get inventoryErrorNetwork;

  /// No description provided for @catalogTitle.
  ///
  /// In en, this message translates to:
  /// **'Catalog'**
  String get catalogTitle;

  /// No description provided for @catalogSearchLabel.
  ///
  /// In en, this message translates to:
  /// **'Search by name'**
  String get catalogSearchLabel;

  /// No description provided for @catalogCategoryFilter.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get catalogCategoryFilter;

  /// No description provided for @catalogAllCategories.
  ///
  /// In en, this message translates to:
  /// **'All categories'**
  String get catalogAllCategories;

  /// No description provided for @catalogStatusFilter.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get catalogStatusFilter;

  /// No description provided for @catalogStatusAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get catalogStatusAll;

  /// No description provided for @catalogStatusActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get catalogStatusActive;

  /// No description provided for @catalogStatusInactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get catalogStatusInactive;

  /// No description provided for @catalogEmpty.
  ///
  /// In en, this message translates to:
  /// **'No products found.'**
  String get catalogEmpty;

  /// No description provided for @catalogVariationCount.
  ///
  /// In en, this message translates to:
  /// **'{count} variations'**
  String catalogVariationCount(int count);

  /// No description provided for @catalogInactiveBadge.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get catalogInactiveBadge;

  /// No description provided for @catalogBarcodeLabel.
  ///
  /// In en, this message translates to:
  /// **'Barcode: {barcode}'**
  String catalogBarcodeLabel(String barcode);

  /// No description provided for @catalogProductTitle.
  ///
  /// In en, this message translates to:
  /// **'Product'**
  String get catalogProductTitle;

  /// No description provided for @catalogVariationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Variations'**
  String get catalogVariationsTitle;

  /// No description provided for @catalogLookupTitle.
  ///
  /// In en, this message translates to:
  /// **'Variation lookup'**
  String get catalogLookupTitle;

  /// No description provided for @catalogLookupModeBarcode.
  ///
  /// In en, this message translates to:
  /// **'Barcode'**
  String get catalogLookupModeBarcode;

  /// No description provided for @catalogLookupModeSku.
  ///
  /// In en, this message translates to:
  /// **'SKU'**
  String get catalogLookupModeSku;

  /// No description provided for @catalogLookupCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'Enter or scan a code'**
  String get catalogLookupCodeLabel;

  /// No description provided for @catalogLookupAction.
  ///
  /// In en, this message translates to:
  /// **'Look up'**
  String get catalogLookupAction;

  /// No description provided for @catalogLookupHint.
  ///
  /// In en, this message translates to:
  /// **'Enter a SKU or barcode to resolve a variation.'**
  String get catalogLookupHint;

  /// No description provided for @catalogErrorProductNotFound.
  ///
  /// In en, this message translates to:
  /// **'Product not found.'**
  String get catalogErrorProductNotFound;

  /// No description provided for @catalogErrorVariationNotFound.
  ///
  /// In en, this message translates to:
  /// **'Variation not found.'**
  String get catalogErrorVariationNotFound;

  /// No description provided for @catalogErrorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Network error. Please try again.'**
  String get catalogErrorNetwork;

  /// No description provided for @caixaTitle.
  ///
  /// In en, this message translates to:
  /// **'Cash register'**
  String get caixaTitle;

  /// No description provided for @caixaStatusLoading.
  ///
  /// In en, this message translates to:
  /// **'Checking the cash register...'**
  String get caixaStatusLoading;

  /// No description provided for @caixaNoSessionTitle.
  ///
  /// In en, this message translates to:
  /// **'No open cash register'**
  String get caixaNoSessionTitle;

  /// No description provided for @caixaNoSessionMessage.
  ///
  /// In en, this message translates to:
  /// **'Open the cash register to start the day.'**
  String get caixaNoSessionMessage;

  /// No description provided for @caixaOpenAction.
  ///
  /// In en, this message translates to:
  /// **'Open cash register'**
  String get caixaOpenAction;

  /// No description provided for @caixaOpenTitle.
  ///
  /// In en, this message translates to:
  /// **'Open cash register'**
  String get caixaOpenTitle;

  /// No description provided for @caixaOpeningAmountLabel.
  ///
  /// In en, this message translates to:
  /// **'Opening amount'**
  String get caixaOpeningAmountLabel;

  /// No description provided for @caixaOpeningAmountRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the opening amount.'**
  String get caixaOpeningAmountRequired;

  /// No description provided for @caixaOpeningAmountInvalid.
  ///
  /// In en, this message translates to:
  /// **'Amount cannot be negative.'**
  String get caixaOpeningAmountInvalid;

  /// No description provided for @caixaOpenedToast.
  ///
  /// In en, this message translates to:
  /// **'Cash register opened.'**
  String get caixaOpenedToast;

  /// No description provided for @caixaActiveTitle.
  ///
  /// In en, this message translates to:
  /// **'Active cash register'**
  String get caixaActiveTitle;

  /// No description provided for @caixaSummaryTitle.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get caixaSummaryTitle;

  /// No description provided for @caixaSummaryOpening.
  ///
  /// In en, this message translates to:
  /// **'Opening'**
  String get caixaSummaryOpening;

  /// No description provided for @caixaSummarySupplies.
  ///
  /// In en, this message translates to:
  /// **'Supplies'**
  String get caixaSummarySupplies;

  /// No description provided for @caixaSummaryCashSales.
  ///
  /// In en, this message translates to:
  /// **'Cash sales'**
  String get caixaSummaryCashSales;

  /// No description provided for @caixaSummaryWithdrawals.
  ///
  /// In en, this message translates to:
  /// **'Withdrawals'**
  String get caixaSummaryWithdrawals;

  /// No description provided for @caixaSummaryExpected.
  ///
  /// In en, this message translates to:
  /// **'Expected'**
  String get caixaSummaryExpected;

  /// No description provided for @caixaSummaryCounted.
  ///
  /// In en, this message translates to:
  /// **'Counted'**
  String get caixaSummaryCounted;

  /// No description provided for @caixaSummaryDivergence.
  ///
  /// In en, this message translates to:
  /// **'Divergence'**
  String get caixaSummaryDivergence;

  /// No description provided for @caixaMovementsTitle.
  ///
  /// In en, this message translates to:
  /// **'Movements'**
  String get caixaMovementsTitle;

  /// No description provided for @caixaEmptyMovements.
  ///
  /// In en, this message translates to:
  /// **'No movements yet.'**
  String get caixaEmptyMovements;

  /// No description provided for @caixaWithdrawalAction.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal'**
  String get caixaWithdrawalAction;

  /// No description provided for @caixaSupplyAction.
  ///
  /// In en, this message translates to:
  /// **'Supply'**
  String get caixaSupplyAction;

  /// No description provided for @caixaCloseAction.
  ///
  /// In en, this message translates to:
  /// **'Close cash register'**
  String get caixaCloseAction;

  /// No description provided for @caixaWithdrawalTitle.
  ///
  /// In en, this message translates to:
  /// **'Register withdrawal'**
  String get caixaWithdrawalTitle;

  /// No description provided for @caixaSupplyTitle.
  ///
  /// In en, this message translates to:
  /// **'Register supply'**
  String get caixaSupplyTitle;

  /// No description provided for @caixaAmountLabel.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get caixaAmountLabel;

  /// No description provided for @caixaAmountRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the amount.'**
  String get caixaAmountRequired;

  /// No description provided for @caixaAmountInvalid.
  ///
  /// In en, this message translates to:
  /// **'Amount must be greater than zero.'**
  String get caixaAmountInvalid;

  /// No description provided for @caixaObservationLabel.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get caixaObservationLabel;

  /// No description provided for @caixaObservationRequired.
  ///
  /// In en, this message translates to:
  /// **'A note is required.'**
  String get caixaObservationRequired;

  /// No description provided for @caixaWithdrawalToast.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal registered.'**
  String get caixaWithdrawalToast;

  /// No description provided for @caixaSupplyToast.
  ///
  /// In en, this message translates to:
  /// **'Supply registered.'**
  String get caixaSupplyToast;

  /// No description provided for @caixaCloseTitle.
  ///
  /// In en, this message translates to:
  /// **'Close cash register'**
  String get caixaCloseTitle;

  /// No description provided for @caixaCountedAmountLabel.
  ///
  /// In en, this message translates to:
  /// **'Counted amount'**
  String get caixaCountedAmountLabel;

  /// No description provided for @caixaCountedAmountRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the counted amount.'**
  String get caixaCountedAmountRequired;

  /// No description provided for @caixaCountedAmountInvalid.
  ///
  /// In en, this message translates to:
  /// **'Amount cannot be negative.'**
  String get caixaCountedAmountInvalid;

  /// No description provided for @caixaDivergenceSurplus.
  ///
  /// In en, this message translates to:
  /// **'Surplus'**
  String get caixaDivergenceSurplus;

  /// No description provided for @caixaDivergenceShortage.
  ///
  /// In en, this message translates to:
  /// **'Shortage'**
  String get caixaDivergenceShortage;

  /// No description provided for @caixaDivergenceNone.
  ///
  /// In en, this message translates to:
  /// **'No divergence'**
  String get caixaDivergenceNone;

  /// No description provided for @caixaCloseConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Close cash register?'**
  String get caixaCloseConfirmTitle;

  /// No description provided for @caixaCloseConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'This action cannot be undone. Confirm the counted amount and divergence before closing.'**
  String get caixaCloseConfirmMessage;

  /// No description provided for @caixaCloseConfirmAction.
  ///
  /// In en, this message translates to:
  /// **'Confirm and close'**
  String get caixaCloseConfirmAction;

  /// No description provided for @caixaCancelAction.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get caixaCancelAction;

  /// No description provided for @caixaClosedToast.
  ///
  /// In en, this message translates to:
  /// **'Cash register closed.'**
  String get caixaClosedToast;

  /// No description provided for @caixaSubmitAction.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get caixaSubmitAction;

  /// No description provided for @caixaRefresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get caixaRefresh;

  /// No description provided for @caixaTypeAbertura.
  ///
  /// In en, this message translates to:
  /// **'Opening'**
  String get caixaTypeAbertura;

  /// No description provided for @caixaTypeSuprimento.
  ///
  /// In en, this message translates to:
  /// **'Supply'**
  String get caixaTypeSuprimento;

  /// No description provided for @caixaTypeSangria.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal'**
  String get caixaTypeSangria;

  /// No description provided for @caixaTypeVendaDinheiro.
  ///
  /// In en, this message translates to:
  /// **'Cash sale'**
  String get caixaTypeVendaDinheiro;

  /// No description provided for @caixaTypeFechamento.
  ///
  /// In en, this message translates to:
  /// **'Closing'**
  String get caixaTypeFechamento;

  /// No description provided for @caixaErrorAlreadyOpen.
  ///
  /// In en, this message translates to:
  /// **'There is already an open cash register.'**
  String get caixaErrorAlreadyOpen;

  /// No description provided for @caixaErrorNotFound.
  ///
  /// In en, this message translates to:
  /// **'Cash register not found.'**
  String get caixaErrorNotFound;

  /// No description provided for @caixaErrorAlreadyClosed.
  ///
  /// In en, this message translates to:
  /// **'This cash register is already closed.'**
  String get caixaErrorAlreadyClosed;

  /// No description provided for @caixaErrorPendingSale.
  ///
  /// In en, this message translates to:
  /// **'There is a pending sale; finish it before closing.'**
  String get caixaErrorPendingSale;

  /// No description provided for @caixaErrorInvalidAmount.
  ///
  /// In en, this message translates to:
  /// **'Invalid amount.'**
  String get caixaErrorInvalidAmount;

  /// No description provided for @caixaErrorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Network error. Please try again.'**
  String get caixaErrorNetwork;

  /// No description provided for @vendasTitle.
  ///
  /// In en, this message translates to:
  /// **'Sale'**
  String get vendasTitle;

  /// No description provided for @vendasPdvTitle.
  ///
  /// In en, this message translates to:
  /// **'Counter sale'**
  String get vendasPdvTitle;

  /// No description provided for @vendasStarting.
  ///
  /// In en, this message translates to:
  /// **'Starting the sale...'**
  String get vendasStarting;

  /// No description provided for @vendasBipLabel.
  ///
  /// In en, this message translates to:
  /// **'Scan or type a code'**
  String get vendasBipLabel;

  /// No description provided for @vendasBipModeBarcode.
  ///
  /// In en, this message translates to:
  /// **'Barcode'**
  String get vendasBipModeBarcode;

  /// No description provided for @vendasBipModeSku.
  ///
  /// In en, this message translates to:
  /// **'SKU'**
  String get vendasBipModeSku;

  /// No description provided for @vendasAddAction.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get vendasAddAction;

  /// No description provided for @vendasEmptyItems.
  ///
  /// In en, this message translates to:
  /// **'No items yet. Scan a product to start.'**
  String get vendasEmptyItems;

  /// No description provided for @vendasItemQuantity.
  ///
  /// In en, this message translates to:
  /// **'Qty {quantity}'**
  String vendasItemQuantity(int quantity);

  /// No description provided for @vendasRemoveItem.
  ///
  /// In en, this message translates to:
  /// **'Remove item'**
  String get vendasRemoveItem;

  /// No description provided for @vendasRemoveItemConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Remove item?'**
  String get vendasRemoveItemConfirmTitle;

  /// No description provided for @vendasRemoveItemConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'This item will be removed from the sale.'**
  String get vendasRemoveItemConfirmMessage;

  /// No description provided for @vendasRemoveItemConfirmAction.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get vendasRemoveItemConfirmAction;

  /// No description provided for @vendasSubtotal.
  ///
  /// In en, this message translates to:
  /// **'Subtotal'**
  String get vendasSubtotal;

  /// No description provided for @vendasDiscount.
  ///
  /// In en, this message translates to:
  /// **'Discount'**
  String get vendasDiscount;

  /// No description provided for @vendasTotal.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get vendasTotal;

  /// No description provided for @vendasDiscountAction.
  ///
  /// In en, this message translates to:
  /// **'Discount'**
  String get vendasDiscountAction;

  /// No description provided for @vendasDiscountTitle.
  ///
  /// In en, this message translates to:
  /// **'Apply discount'**
  String get vendasDiscountTitle;

  /// No description provided for @vendasDiscountModeValue.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get vendasDiscountModeValue;

  /// No description provided for @vendasDiscountModePercent.
  ///
  /// In en, this message translates to:
  /// **'Percent'**
  String get vendasDiscountModePercent;

  /// No description provided for @vendasDiscountValueLabel.
  ///
  /// In en, this message translates to:
  /// **'Discount value'**
  String get vendasDiscountValueLabel;

  /// No description provided for @vendasDiscountValueRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the discount value.'**
  String get vendasDiscountValueRequired;

  /// No description provided for @vendasDiscountValueInvalid.
  ///
  /// In en, this message translates to:
  /// **'Invalid discount value.'**
  String get vendasDiscountValueInvalid;

  /// No description provided for @vendasDiscountExceedsSubtotal.
  ///
  /// In en, this message translates to:
  /// **'The discount cannot exceed the subtotal.'**
  String get vendasDiscountExceedsSubtotal;

  /// No description provided for @vendasDiscountApplied.
  ///
  /// In en, this message translates to:
  /// **'Discount applied.'**
  String get vendasDiscountApplied;

  /// No description provided for @vendasFinalizeAction.
  ///
  /// In en, this message translates to:
  /// **'Finalize sale'**
  String get vendasFinalizeAction;

  /// No description provided for @vendasFinalizeTitle.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get vendasFinalizeTitle;

  /// No description provided for @vendasPaymentFormLabel.
  ///
  /// In en, this message translates to:
  /// **'Payment method'**
  String get vendasPaymentFormLabel;

  /// No description provided for @vendasPaymentAmountLabel.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get vendasPaymentAmountLabel;

  /// No description provided for @vendasPaymentAddAction.
  ///
  /// In en, this message translates to:
  /// **'Add payment'**
  String get vendasPaymentAddAction;

  /// No description provided for @vendasPaymentRemove.
  ///
  /// In en, this message translates to:
  /// **'Remove payment'**
  String get vendasPaymentRemove;

  /// No description provided for @vendasPaymentsTotal.
  ///
  /// In en, this message translates to:
  /// **'Payments'**
  String get vendasPaymentsTotal;

  /// No description provided for @vendasRemaining.
  ///
  /// In en, this message translates to:
  /// **'Remaining'**
  String get vendasRemaining;

  /// No description provided for @vendasFinalizeConfirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm payment'**
  String get vendasFinalizeConfirm;

  /// No description provided for @vendasFinalizeBlocked.
  ///
  /// In en, this message translates to:
  /// **'Payments must equal the total to finalize.'**
  String get vendasFinalizeBlocked;

  /// No description provided for @vendasFinalizedToast.
  ///
  /// In en, this message translates to:
  /// **'Sale finalized.'**
  String get vendasFinalizedToast;

  /// No description provided for @vendasCancelAction.
  ///
  /// In en, this message translates to:
  /// **'Cancel sale'**
  String get vendasCancelAction;

  /// No description provided for @vendasCancelConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Cancel sale?'**
  String get vendasCancelConfirmTitle;

  /// No description provided for @vendasCancelConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'This action cannot be undone and reverses the sale.'**
  String get vendasCancelConfirmMessage;

  /// No description provided for @vendasCancelConfirmAction.
  ///
  /// In en, this message translates to:
  /// **'Cancel sale'**
  String get vendasCancelConfirmAction;

  /// No description provided for @vendasKeepEditing.
  ///
  /// In en, this message translates to:
  /// **'Keep editing'**
  String get vendasKeepEditing;

  /// No description provided for @vendasCancelledToast.
  ///
  /// In en, this message translates to:
  /// **'Sale cancelled.'**
  String get vendasCancelledToast;

  /// No description provided for @vendasReadOnlyBanner.
  ///
  /// In en, this message translates to:
  /// **'This sale is finalized and read-only.'**
  String get vendasReadOnlyBanner;

  /// No description provided for @vendasStatusAberta.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get vendasStatusAberta;

  /// No description provided for @vendasStatusConcluida.
  ///
  /// In en, this message translates to:
  /// **'Finalized'**
  String get vendasStatusConcluida;

  /// No description provided for @vendasStatusCancelada.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get vendasStatusCancelada;

  /// No description provided for @vendasPaymentDinheiro.
  ///
  /// In en, this message translates to:
  /// **'Cash'**
  String get vendasPaymentDinheiro;

  /// No description provided for @vendasPaymentCartaoDebito.
  ///
  /// In en, this message translates to:
  /// **'Debit card'**
  String get vendasPaymentCartaoDebito;

  /// No description provided for @vendasPaymentCartaoCredito.
  ///
  /// In en, this message translates to:
  /// **'Credit card'**
  String get vendasPaymentCartaoCredito;

  /// No description provided for @vendasPaymentPix.
  ///
  /// In en, this message translates to:
  /// **'Pix'**
  String get vendasPaymentPix;

  /// No description provided for @vendasNoSessionTitle.
  ///
  /// In en, this message translates to:
  /// **'No open cash register'**
  String get vendasNoSessionTitle;

  /// No description provided for @vendasNoSessionMessage.
  ///
  /// In en, this message translates to:
  /// **'Open the cash register before selling.'**
  String get vendasNoSessionMessage;

  /// No description provided for @vendasOpenCashAction.
  ///
  /// In en, this message translates to:
  /// **'Open cash register'**
  String get vendasOpenCashAction;

  /// No description provided for @vendasErrorNotFound.
  ///
  /// In en, this message translates to:
  /// **'Sale not found.'**
  String get vendasErrorNotFound;

  /// No description provided for @vendasErrorAlreadyFinalized.
  ///
  /// In en, this message translates to:
  /// **'This sale is already finalized.'**
  String get vendasErrorAlreadyFinalized;

  /// No description provided for @vendasErrorNoOpenCashSession.
  ///
  /// In en, this message translates to:
  /// **'There is no open cash register.'**
  String get vendasErrorNoOpenCashSession;

  /// No description provided for @vendasErrorInsufficientStock.
  ///
  /// In en, this message translates to:
  /// **'Insufficient stock for one of the items.'**
  String get vendasErrorInsufficientStock;

  /// No description provided for @vendasErrorPaymentMismatch.
  ///
  /// In en, this message translates to:
  /// **'Payments do not match the sale total.'**
  String get vendasErrorPaymentMismatch;

  /// No description provided for @vendasErrorInvalidInput.
  ///
  /// In en, this message translates to:
  /// **'Invalid value.'**
  String get vendasErrorInvalidInput;

  /// No description provided for @vendasErrorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Network error. Please try again.'**
  String get vendasErrorNetwork;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'pt'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'pt':
      return AppLocalizationsPt();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
