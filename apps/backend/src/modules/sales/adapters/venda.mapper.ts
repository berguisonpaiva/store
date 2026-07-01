import { ResumoVendasDTO, VendaDTO } from '@repo/sales';
import { centsToReais } from './money';
import { ResumoVendasOutDTO, VendaOutDTO } from '../dto';

/// Maps a domain `VendaDTO` (money in integer cents) to the HTTP `VendaOutDTO`
/// (money in reais). The single boundary where sale money becomes reais.
export function toVendaOut(dto: VendaDTO): VendaOutDTO {
  return {
    id: dto.id,
    numero: dto.numero,
    canal: dto.canal,
    status: dto.status,
    usuarioId: dto.usuarioId,
    sessaoCaixaId: dto.sessaoCaixaId,
    subtotal: centsToReais(dto.subtotal),
    desconto: centsToReais(dto.desconto),
    total: centsToReais(dto.total),
    itens: dto.itens.map((item) => ({
      id: item.id,
      variacaoId: item.variacaoId,
      quantidade: item.quantidade,
      precoUnitario: centsToReais(item.precoUnitario),
      total: centsToReais(item.total),
    })),
    pagamentos: dto.pagamentos.map((pagamento) => ({
      id: pagamento.id,
      forma: pagamento.forma,
      valor: centsToReais(pagamento.valor),
    })),
    concluidaEm: dto.concluidaEm,
    canceladaEm: dto.canceladaEm,
    criadoEm: dto.criadoEm,
  };
}

/// Maps a domain `ResumoVendasDTO` (cents) to the HTTP `ResumoVendasOutDTO` (reais).
export function toResumoVendasOut(dto: ResumoVendasDTO): ResumoVendasOutDTO {
  return {
    quantidade: dto.quantidade,
    subtotal: centsToReais(dto.subtotal),
    desconto: centsToReais(dto.desconto),
    total: centsToReais(dto.total),
    porFormaPagamento: dto.porFormaPagamento.map((item) => ({
      forma: item.forma,
      total: centsToReais(item.total),
      quantidade: item.quantidade,
    })),
  };
}
