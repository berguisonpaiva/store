/// Parses a free-form money input (reais) into integer cents.
///
/// Accepts `19`, `19.90`, `19,90`, `1.234,56`, and `1,234.56`. Returns `null`
/// when the text cannot be parsed as a non-negative amount.
int? parseReaisToCents(String raw) {
  var text = raw.trim();
  if (text.isEmpty) return null;

  final hasComma = text.contains(',');
  final hasDot = text.contains('.');

  if (hasComma && hasDot) {
    // The last separator is the decimal one; the other groups thousands.
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replaceAll('.', '').replaceAll(',', '.');
    } else {
      text = text.replaceAll(',', '');
    }
  } else if (hasComma) {
    text = text.replaceAll(',', '.');
  }

  final value = double.tryParse(text);
  if (value == null || value < 0) return null;
  return (value * 100).round();
}
