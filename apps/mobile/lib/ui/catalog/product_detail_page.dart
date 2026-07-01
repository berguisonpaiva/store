import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../theme/app_spacing.dart';
import 'catalog_l10n.dart';
import 'view_model/product_detail_cubit.dart';
import 'view_model/product_detail_state.dart';
import 'widgets/variation_tile.dart';

/// Shows a product with its variations (SKU, price, status).
class ProductDetailPage extends StatefulWidget {
  const ProductDetailPage({super.key, required this.productId});

  final String productId;

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  late final ProductDetailCubit _cubit = getIt<ProductDetailCubit>()
    ..load(widget.productId);

  @override
  void dispose() {
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.catalogProductTitle)),
      body: BlocBuilder<ProductDetailCubit, ProductDetailState>(
        bloc: _cubit,
        builder: (context, state) {
          if (state.isLoading || state.status == ProductDetailStatus.idle) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.status != ProductDetailStatus.loaded ||
              state.product == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Text(
                  l10n.catalogError(state.errorCode),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final product = state.product!;
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: [
              Text(product.name, style: Theme.of(context).textTheme.headlineSmall),
              if (!product.active) ...[
                const SizedBox(height: AppSpacing.xs),
                Chip(label: Text(l10n.catalogInactiveBadge)),
              ],
              if (product.description != null &&
                  product.description!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  product.description!,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              Text(
                l10n.catalogVariationsTitle,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              for (final variation in product.variations)
                VariationTile(variation: variation),
            ],
          );
        },
      ),
    );
  }
}
