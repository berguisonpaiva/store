'use client';

import * as React from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ConfirmDeleteDialogProps {
  children: React.ReactElement;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<boolean> | boolean;
}

export function ConfirmDeleteDialog({
  children,
  title = 'Confirmar exclusão',
  description = 'Essa ação não poderá ser desfeita.',
  confirmLabel = 'Excluir',
  pendingLabel = 'Excluindo...',
  cancelLabel = 'Cancelar',
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  async function handleConfirm() {
    setIsPending(true);

    try {
      const shouldClose = await onConfirm();
      if (shouldClose !== false) {
        setOpen(false);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending && !nextOpen) return;
        setOpen(nextOpen);
      }}
      disablePointerDismissal={isPending}
    >
      <DialogTrigger render={children} />
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end gap-2 sm:space-x-0">
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>{cancelLabel}</DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
