'use client';

import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PageSectionHeader } from '@/components/ui/page-section-header';
import { StandardDialogContent } from '@/components/ui/standard-dialog-content';
import { formatBRL, formatDateTime } from '../data/format';
import type { MovimentacaoDTO, ResumoSessaoDTO, SessaoOutDTO } from '../data/types';
import { FecharCaixaForm } from './fechar-caixa-form';
import { MovimentacaoForm } from './movimentacao-form';
import { MovimentacoesList } from './movimentacoes-list';
import { ResumoPanel } from './resumo-panel';

type ActiveDialog = 'sangria' | 'suprimento' | 'fechar' | null;

type SessaoAtivaPanelProps = {
  sessao: SessaoOutDTO;
  resumo: ResumoSessaoDTO;
  movimentacoes: MovimentacaoDTO[];
  /** Whether the current operator may register movements / close the session. */
  canOperate?: boolean;
};

export function SessaoAtivaPanel({
  sessao,
  resumo,
  movimentacoes,
  canOperate = true,
}: SessaoAtivaPanelProps) {
  const [dialog, setDialog] = useState<ActiveDialog>(null);

  const close = () => setDialog(null);

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge={<Badge variant="secondary">Caixa aberto</Badge>}
        title="Sessão ativa"
        subtitle={`Aberto em ${formatDateTime(sessao.abertaEm)} · abertura ${formatBRL(sessao.valorAbertura)}`}
        aside={
          canOperate ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setDialog('suprimento')}>
                <ArrowUpCircle className="size-4" />
                Suprimento
              </Button>
              <Button variant="outline" onClick={() => setDialog('sangria')}>
                <ArrowDownCircle className="size-4" />
                Sangria
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-600 hover:opacity-90"
                onClick={() => setDialog('fechar')}
              >
                <Lock className="size-4" />
                Fechar caixa
              </Button>
            </div>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ResumoPanel resumo={resumo} />
        <MovimentacoesList movimentacoes={movimentacoes} />
      </div>

      <Dialog open={dialog === 'suprimento'} onOpenChange={(open) => !open && close()}>
        <StandardDialogContent
          title="Registrar suprimento"
          description="Adicione dinheiro ao caixa (reforço)."
        >
          <MovimentacaoForm
            sessaoId={sessao.id}
            kind="suprimento"
            onSuccess={close}
            onCancel={close}
          />
        </StandardDialogContent>
      </Dialog>

      <Dialog open={dialog === 'sangria'} onOpenChange={(open) => !open && close()}>
        <StandardDialogContent
          title="Registrar sangria"
          description="Retire dinheiro do caixa."
        >
          <MovimentacaoForm
            sessaoId={sessao.id}
            kind="sangria"
            onSuccess={close}
            onCancel={close}
          />
        </StandardDialogContent>
      </Dialog>

      <Dialog open={dialog === 'fechar'} onOpenChange={(open) => !open && close()}>
        <StandardDialogContent
          title="Fechar caixa"
          description="Confira o valor contado e a divergência antes de confirmar."
        >
          <FecharCaixaForm
            sessaoId={sessao.id}
            esperado={resumo.esperado}
            onSuccess={close}
            onCancel={close}
          />
        </StandardDialogContent>
      </Dialog>
    </div>
  );
}
