'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/actions-utils';
import { showErrorToast } from '@/lib/error-toast';

/** Payload genérico de download retornado por uma server action (base64). */
export type DownloadPayload = {
  filename: string;
  contentType: string;
  base64: string;
};

type ExportButtonProps = {
  label: string;
  /** Server action que retorna `DownloadPayload` em base64. */
  action: () => Promise<ActionResult<DownloadPayload>>;
};

/**
 * Botão genérico para downloads de arquivos vindos de server actions
 * (recebe base64 + content-type + filename, converte para Blob e dispara
 * o download via âncora programática).
 */
export function ExportButton({ label, action }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const res = await action();
      if (!res.success) {
        showErrorToast(res.error);
        return;
      }
      triggerDownload(res.data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={busy}>
      <Download className="mr-2 size-4" />
      {busy ? 'Gerando…' : label}
    </Button>
  );
}

function triggerDownload({ filename, contentType, base64 }: DownloadPayload) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
