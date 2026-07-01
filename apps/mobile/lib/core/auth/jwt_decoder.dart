/// Decodes a JWT payload (no signature verification). The token is obtained
/// over a trusted login/refresh call and used only to populate display fields
/// and the role — never as a security decision on the device.
abstract interface class JwtDecoder {
  /// Returns the decoded payload claims, or throws [FormatException] when the
  /// token is malformed.
  Map<String, dynamic> decode(String token);
}
