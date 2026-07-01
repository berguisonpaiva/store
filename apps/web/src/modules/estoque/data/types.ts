import type { PaginationMetaDTO, VariationLookupDTO } from '@/modules/catalog/data/types';

export type InventoryBalanceDTO = {
  variacaoId: string;
  saldoAtual: number;
  estoqueMinimo: number;
};

export type InventoryMovementDTO = {
  id: string;
  variacaoId: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  motivo:
    | 'COMPRA'
    | 'AJUSTE'
    | 'DEVOLUCAO'
    | 'VENDA_PDV'
    | 'VENDA_ONLINE'
    | 'PERDA';
  quantidade: number;
  saldoResultante: number;
  origemVendaId: string | null;
  timestamp: string;
};

export type InventoryLowStockItemDTO = {
  variacaoId: string;
  saldoAtual: number;
  estoqueMinimo: number;
};

export type InventoryMovementsResultDTO = {
  data: InventoryMovementDTO[];
  meta: PaginationMetaDTO;
};

export type ListInventoryMovementsParams = {
  variacaoId: string;
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
};

export type InventoryVariationOption = {
  value: string;
  label: string;
  sku: string;
  barcode: string | null;
  productName: string;
  variationSummary: string;
  active: boolean;
  productActive: boolean;
};

export type InventoryOperationResultDTO = InventoryMovementDTO;

export type InventoryVariationLookupDTO = VariationLookupDTO;
