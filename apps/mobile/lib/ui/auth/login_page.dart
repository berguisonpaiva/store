import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/di/injector.dart';
import '../../l10n/app_localizations.dart';
import '../shared/feedback/app_toast.dart';
import '../shared/widgets/primary_button.dart';
import '../theme/app_spacing.dart';
import 'view_model/login_cubit.dart';
import 'view_model/login_state.dart';

final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Login screen. Owns its [LoginCubit] (from get_it) and renders via an
/// explicit-bloc [BlocConsumer] — no `BlocProvider`. On success the app session
/// flips to authenticated and the router redirects automatically.
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  late final LoginCubit _cubit = getIt<LoginCubit>();
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _cubit.close();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      _cubit.submit(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: BlocConsumer<LoginCubit, LoginState>(
                bloc: _cubit,
                listener: (context, state) {
                  if (state.status == LoginStatus.failure) {
                    AppToast.error(context, l10n.loginInvalidCredentials);
                  }
                },
                builder: (context, state) {
                  return Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          l10n.loginTitle,
                          style: Theme.of(context).textTheme.headlineSmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          l10n.loginSubtitle,
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          autofillHints: const [AutofillHints.email],
                          enabled: !state.isSubmitting,
                          decoration: InputDecoration(
                            labelText: l10n.loginEmailLabel,
                          ),
                          validator: (value) {
                            final v = value?.trim() ?? '';
                            if (v.isEmpty) return l10n.loginEmailRequired;
                            if (!_emailRegex.hasMatch(v)) {
                              return l10n.loginEmailInvalid;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: AppSpacing.md),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          autofillHints: const [AutofillHints.password],
                          enabled: !state.isSubmitting,
                          decoration: InputDecoration(
                            labelText: l10n.loginPasswordLabel,
                          ),
                          onFieldSubmitted: (_) => _submit(),
                          validator: (value) {
                            if ((value ?? '').isEmpty) {
                              return l10n.loginPasswordRequired;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        PrimaryButton(
                          label: l10n.loginSubmit,
                          onPressed: _submit,
                          isLoading: state.isSubmitting,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
