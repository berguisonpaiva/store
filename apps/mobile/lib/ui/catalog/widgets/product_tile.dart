import 'package:flutter/material.dart';

import '../../../domain/catalog/entities/product_summary_entity.dart';
import '../../../l10n/app_localizations.dart';

/// A single product row in the list.
class ProductTile extends StatelessWidget {
  const ProductTile({
    super.key,
    required this.product,
    required this.onTap,
  });

  final ProductSummaryEntity product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      child: ListTile(
        title: Text(product.name),
        subtitle: Text(l10n.catalogVariationCount(product.variationCount)),
        trailing: product.active
            ? const Icon(Icons.chevron_right)
            : Chip(label: Text(l10n.catalogInactiveBadge)),
        onTap: onTap,
      ),
    );
  }
}
