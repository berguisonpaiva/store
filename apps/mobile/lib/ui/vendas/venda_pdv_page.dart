import 'package:flutter/material.dart';

import '../../app/di/injector.dart';
import 'venda_pdv_view.dart';
import 'view_model/venda_pdv_cubit.dart';

/// Route wrapper for the PDV sale screen. Owns the [VendaPdvCubit] lifecycle
/// (resolved from get_it), kicks off the sale, and injects navigation callbacks
/// into [VendaPdvView]. Constructing the cubit in the State guards against
/// GoRouter rebuilds re-running the unloaded cubit.
class VendaPdvPage extends StatefulWidget {
  const VendaPdvPage({super.key, required this.onOpenCash});

  /// Navigation to the cash-register flow when there is no open session.
  final VoidCallback onOpenCash;

  @override
  State<VendaPdvPage> createState() => _VendaPdvPageState();
}

class _VendaPdvPageState extends State<VendaPdvPage> {
  late final VendaPdvCubit _cubit = getIt<VendaPdvCubit>();

  @override
  void initState() {
    super.initState();
    _cubit.start();
  }

  @override
  void dispose() {
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return VendaPdvView(viewModel: _cubit, onOpenCash: widget.onOpenCash);
  }
}
