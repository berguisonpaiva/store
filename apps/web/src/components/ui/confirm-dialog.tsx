'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { StandardDialogContent } from '@/components/ui/standard-dialog-content';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  /** Style the confirm button as a destructive action. */
  destructive?: boolean;
};

/**
 * Lightweight confirm dialog for reversible actions (e.g. soft-delete /
 * deactivate). Unlike `DeleteConfirmationDialog`, it does not require typing a
 * confirmation word — appropriate when the action can be undone.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmar ação',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogContent
        title={title}
        description={description}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={destructive ? undefined : 'default'}
              className={
                destructive
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : undefined
              }
              onClick={onConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? 'Processando...' : confirmLabel}
            </Button>
          </>
        }
      />
    </Dialog>
  );
}
