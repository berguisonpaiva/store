import 'dart:convert';

import 'jwt_decoder.dart';

/// Pure JWT payload decoder using built-in base64 (no external package).
class JwtDecoderImpl implements JwtDecoder {
  const JwtDecoderImpl();

  @override
  Map<String, dynamic> decode(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      throw const FormatException('Invalid JWT: expected 3 segments');
    }

    final normalized = base64Url.normalize(parts[1]);
    final payload = utf8.decode(base64Url.decode(normalized));
    final decoded = jsonDecode(payload);

    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Invalid JWT payload');
    }
    return decoded;
  }
}
