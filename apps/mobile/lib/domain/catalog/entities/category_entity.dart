import 'package:equatable/equatable.dart';

/// A catalog category, as understood by the domain.
class CategoryEntity extends Equatable {
  const CategoryEntity({
    required this.id,
    required this.name,
    required this.active,
  });

  final String id;
  final String name;
  final bool active;

  @override
  List<Object?> get props => [id, name, active];
}
