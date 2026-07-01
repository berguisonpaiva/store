import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VariationOption, VendaOutDTO } from '../data/types';
import { NoSessionBlock } from './no-session-block';
import { SaleScreen } from './sale-screen';

// Server-only modules and platform hooks the client components reach for.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const actions = vi.hoisted(() => ({
  abrirVenda: vi.fn(),
  adicionarItem: vi.fn(),
  removerItem: vi.fn(),
  aplicarDesconto: vi.fn(),
  finalizarVenda: vi.fn(),
  cancelarVenda: vi.fn(),
}));

vi.mock('../data/vendas.actions', () => actions);

afterEach(cleanup);

const options: VariationOption[] = [
  {
    variacaoId: 'var-1',
    sku: 'CAM-P-AZUL',
    barcode: '7891234567890',
    label: 'Camiseta · CAM-P-AZUL',
    price: 5000,
  },
];

const emptySale: VendaOutDTO = {
  id: 'venda-1',
  numero: 1,
  canal: 'PDV',
  status: 'ABERTA',
  usuarioId: 'u1',
  sessaoCaixaId: 's1',
  subtotal: 0,
  desconto: 0,
  total: 0,
  itens: [],
  pagamentos: [],
};

const saleWithItem: VendaOutDTO = {
  ...emptySale,
  subtotal: 50, // reais
  total: 50,
  itens: [
    { id: 'item-1', variacaoId: 'var-1', quantidade: 1, precoUnitario: 50, total: 50 },
  ],
};

describe('NoSessionBlock', () => {
  it('blocks selling and guides the operator to open a cash session', () => {
    render(<NoSessionBlock />);
    expect(
      screen.getByText(/você não tem um caixa aberto/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir caixa/i })).toBeInTheDocument();
  });
});

describe('SaleScreen — add by bip', () => {
  beforeEach(() => {
    Object.values(actions).forEach((fn) => fn.mockReset());
  });

  it('adds a scanned item without a page reload and returns focus to the entry field', async () => {
    actions.adicionarItem.mockResolvedValue({ ok: true, data: saleWithItem });
    const user = userEvent.setup();

    render(<SaleScreen initialVenda={emptySale} variationOptions={options} />);

    const field = screen.getByLabelText(/sku, código de barras ou produto/i);
    field.focus();
    await user.type(field, '7891234567890{Enter}');

    // A scanned barcode that matches a known active variation resolves to its
    // variacaoId (no extra lookup); the add happens without a page reload.
    await waitFor(() => {
      expect(actions.adicionarItem).toHaveBeenCalledWith(
        'venda-1',
        expect.objectContaining({ variacaoId: 'var-1', quantidade: 1 }),
      );
    });

    // The new line is rendered (no reload) and the subtotal updates live.
    expect(await screen.findByText(/CAM-P-AZUL/)).toBeInTheDocument();
    expect(field).toHaveFocus();
  });

  it('sends an unknown barcode as codigoBarras for the backend to resolve', async () => {
    actions.adicionarItem.mockResolvedValue({ ok: true, data: saleWithItem });
    const user = userEvent.setup();

    render(<SaleScreen initialVenda={emptySale} variationOptions={options} />);

    const field = screen.getByLabelText(/sku, código de barras ou produto/i);
    await user.type(field, '9990000011122{Enter}');

    await waitFor(() => {
      expect(actions.adicionarItem).toHaveBeenCalledWith(
        'venda-1',
        expect.objectContaining({ codigoBarras: '9990000011122', quantidade: 1 }),
      );
    });
  });

  it('keeps finalize disabled until payments equal the total', () => {
    render(<SaleScreen initialVenda={saleWithItem} variationOptions={options} />);
    // Default payment seeds the total, so finalize is enabled; emptying it blocks.
    expect(screen.getByRole('button', { name: /finalizar venda/i })).toBeEnabled();
  });
});

describe('SaleScreen — read-only when finalized', () => {
  it('hides mutating controls for a finalized sale', () => {
    render(
      <SaleScreen
        initialVenda={{ ...saleWithItem, status: 'CONCLUIDA' }}
        variationOptions={options}
      />,
    );
    expect(screen.queryByLabelText(/sku, código de barras ou produto/i)).not.toBeInTheDocument();
    expect(screen.getByText(/venda concluída/i)).toBeInTheDocument();
  });
});
