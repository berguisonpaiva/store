/// Wire model for a successful login/refresh response. The backend returns only
/// tokens (`accessToken`, and `refreshToken` on login); the user is derived by
/// decoding the access token in the repository.
class AuthSessionDto {
  const AuthSessionDto({
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthSessionDto.fromLogin(Map<String, dynamic> json) => AuthSessionDto(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
  );

  /// Refresh returns only `accessToken`; the existing refresh token is kept.
  factory AuthSessionDto.fromRefresh(
    Map<String, dynamic> json,
    String currentRefreshToken,
  ) => AuthSessionDto(
    accessToken: json['accessToken'] as String,
    refreshToken: currentRefreshToken,
  );

  final String accessToken;
  final String refreshToken;
}
