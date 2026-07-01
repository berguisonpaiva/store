import '../dtos/resumo_vendas_dto.dart';
import '../dtos/venda_dto.dart';

/// Remote calls against the backend `/vendas` endpoints. Money is integer cents
/// in both directions. Throws technical exceptions ([SaleException] carrying the
/// backend code, or `AppException`); the repository converts them to failures.
abstract interface class VendasRemoteDataSource {
  Future<VendaDto> criar();

  Future<VendaDto> adicionarItem({
    required String vendaId,
    String? variacaoId,
    String? sku,
    String? codigoBarras,
    required int quantidade,
  });

  Future<VendaDto> removerItem({
    required String vendaId,
    required String itemId,
  });

  Future<VendaDto> aplicarDesconto({
    required String vendaId,
    required String tipo,
    required num valor,
  });

  Future<VendaDto> finalizar({
    required String vendaId,
    required List<Map<String, dynamic>> pagamentos,
  });

  Future<VendaDto> cancelar(String vendaId);

  Future<VendaDto> buscar(String vendaId);

  Future<List<VendaDto>> listar(Map<String, dynamic> query);

  Future<ResumoVendasDto> resumo(Map<String, dynamic> query);
}
