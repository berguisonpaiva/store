import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveCashView } from '../data/cash-view';
import type { MovimentacaoDTO, ResumoSessaoDTO, SessaoOutDTO } from '../data/types';
import { AbrirCaixaForm } from './abrir-caixa-form';
import { SessaoAtivaPanel } from './sessao-ativa-panel';

// Server-only modules and platform hooks the client components reach for.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../data/caixa.actions', () => ({
  abrirCaixa: vi.fn(),
  registrarSangria: vi.fn(),
  registrarSuprimento: vi.fn(),
  fecharCaixa: vi.fn(),
}));

afterEach(cleanup);

const openSession: SessaoOutDTO = {
  id: 'sess-1',
  operadorId: 'op-1',
  status: 'ABERTA',
  valorAbertura: 100,
  valorFechamento: null,
  abertaEm: '2026-06-30T09:00:00.000Z',
  fechadaEm: null,
};

const resumo: ResumoSessaoDTO = {
  abertura: 100,
  suprimentos: 50,
  vendasDinheiro: 200,
  sangrias: 30,
  esperado: 320,
  contado: null,
  divergencia: null,
};

const movimentacoes: MovimentacaoDTO[] = [
  {
    id: 'mov-1',
    tipo: 'SUPRIMENTO',
    valor: 50,
    observacao: 'reforço',
    criadaEm: '2026-06-30T10:00:00.000Z',
  },
];

describe('resolveCashView', () => {
  it('returns "abrir" when there is no open session', () => {
    expect(resolveCashView(null)).toBe('abrir');
  });

  it('returns "sessao-ativa" when a session is open', () => {
    expect(resolveCashView(openSession)).toBe('sessao-ativa');
  });
});

describe('cash screen conditional rendering', () => {
  it('shows only the "Abrir caixa" CTA when there is no session', () => {
    render(<AbrirCaixaForm />);
    expect(screen.getByRole('button', { name: /abrir caixa/i })).toBeInTheDocument();
    expect(screen.queryByText(/sessão ativa/i)).not.toBeInTheDocument();
  });

  it('shows the active session panel (summary + movements + actions) when a session is open', () => {
    render(
      <SessaoAtivaPanel
        sessao={openSession}
        resumo={resumo}
        movimentacoes={movimentacoes}
      />,
    );
    expect(screen.getByText(/sessão ativa/i)).toBeInTheDocument();
    expect(screen.getByText(/resumo da sessão/i)).toBeInTheDocument();
    expect(screen.getByText(/movimentações/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fechar caixa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sangria/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suprimento/i })).toBeInTheDocument();
  });

  it('hides operator actions when canOperate is false', () => {
    render(
      <SessaoAtivaPanel
        sessao={openSession}
        resumo={resumo}
        movimentacoes={movimentacoes}
        canOperate={false}
      />,
    );
    expect(screen.queryByRole('button', { name: /fechar caixa/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sangria/i })).not.toBeInTheDocument();
  });
});
