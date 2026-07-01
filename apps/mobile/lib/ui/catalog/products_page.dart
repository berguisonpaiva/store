import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../theme/app_spacing.dart';
import 'catalog_l10n.dart';
import 'view_model/products_cubit.dart';
import 'view_model/products_state.dart';
import 'widgets/product_tile.dart';

/// Catalog home: the paginated products list with name search and
/// category/status filters. The AppBar action opens the PDV lookup.
class ProductsPage extends StatefulWidget {
  const ProductsPage({super.key});

  @override
  State<ProductsPage> createState() => _ProductsPageState();
}

class _ProductsPageState extends State<ProductsPage> {
  late final ProductsCubit _cubit = getIt<ProductsCubit>()..init();
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _cubit.loadMore();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.catalogTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: l10n.catalogLookupTitle,
            onPressed: () => context.push('/catalog/lookup'),
          ),
        ],
      ),
      body: BlocConsumer<ProductsCubit, ProductsState>(
        bloc: _cubit,
        listener: (context, state) {
          if (state.status == ProductsStatus.error) {
            AppToast.error(context, l10n.catalogError(state.errorCode));
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        labelText: l10n.catalogSearchLabel,
                        prefixIcon: const Icon(Icons.search),
                      ),
                      textInputAction: TextInputAction.search,
                      onSubmitted: _cubit.search,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Expanded(child: _categoryFilter(state, l10n)),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(child: _statusFilter(state, l10n)),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(child: _list(context, state, l10n)),
            ],
          );
        },
      ),
    );
  }

  Widget _categoryFilter(ProductsState state, AppLocalizations l10n) {
    return DropdownButtonFormField<String?>(
      initialValue: state.categoryId,
      isExpanded: true,
      decoration: InputDecoration(labelText: l10n.catalogCategoryFilter),
      items: [
        DropdownMenuItem<String?>(
          value: null,
          child: Text(l10n.catalogAllCategories),
        ),
        for (final category in state.categories)
          DropdownMenuItem<String?>(
            value: category.id,
            child: Text(category.name, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: _cubit.filterCategory,
    );
  }

  Widget _statusFilter(ProductsState state, AppLocalizations l10n) {
    final value = state.active == null ? 'all' : state.active!.toString();
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: l10n.catalogStatusFilter),
      items: [
        DropdownMenuItem(value: 'all', child: Text(l10n.catalogStatusAll)),
        DropdownMenuItem(value: 'true', child: Text(l10n.catalogStatusActive)),
        DropdownMenuItem(
          value: 'false',
          child: Text(l10n.catalogStatusInactive),
        ),
      ],
      onChanged: (value) =>
          _cubit.filterActive(value == 'all' ? null : value == 'true'),
    );
  }

  Widget _list(BuildContext context, ProductsState state, AppLocalizations l10n) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.status == ProductsStatus.loaded && state.items.isEmpty) {
      return Center(
        child: Text(l10n.catalogEmpty, style: Theme.of(context).textTheme.bodyMedium),
      );
    }
    return RefreshIndicator(
      onRefresh: _cubit.refresh,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.items.length) {
            return const Padding(
              padding: EdgeInsets.all(AppSpacing.md),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          final product = state.items[index];
          return ProductTile(
            product: product,
            onTap: () => context.push('/catalog/products/${product.id}'),
          );
        },
      ),
    );
  }
}
