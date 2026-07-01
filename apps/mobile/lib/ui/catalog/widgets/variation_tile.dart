import 'package:flutter/material.dart';

import '../../../domain/catalog/entities/variation_entity.dart';
import '../../../l10n/app_localizations.dart';
import '../../theme/app_spacing.dart';
import '../catalog_l10n.dart';

/// Shows a single variation's SKU, price, and status.
class VariationTile extends StatelessWidget {
  const VariationTile({super.key, required this.variation});

  final VariationEntity variation;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final attributes = variation.attributes.entries
        .map((e) => '${e.key}: ${e.value}')
        .join(' / ');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'SKU ${variation.sku}',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                Text(
                  l10n.formatPrice(variation.priceCents),
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ],
            ),
            if (attributes.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                attributes,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                if (variation.barcode != null)
                  Expanded(
                    child: Text(
                      l10n.catalogBarcodeLabel(variation.barcode!),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  )
                else
                  const Spacer(),
                if (!variation.active)
                  Chip(label: Text(l10n.catalogInactiveBadge)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
