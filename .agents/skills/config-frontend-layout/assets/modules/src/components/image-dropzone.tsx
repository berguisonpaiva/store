'use client';

import { Button } from '@/components/ui/button';
import { showErrorToast } from '@/lib/error-toast';
import { cn } from '@/lib/utils';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

function isValidImageFile(file: File): boolean {
  if (!ACCEPTED_TYPES.includes(file.type)) return false;
  const sizeMB = file.size / (1024 * 1024);
  return sizeMB <= MAX_SIZE_MB;
}

type ImageDropzoneProps = {
  imageUrl: string | null;
  title?: string;
  description?: string;
  onUpload: (file: File) => Promise<string>;
  onSuccess?: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ImageDropzone({
  imageUrl,
  title = 'Imagem do produto',
  description = 'Arraste uma imagem ou clique para selecionar',
  onUpload,
  onSuccess,
  onRemove,
  disabled = false,
  className,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled || isUploading) return;

      if (!isValidImageFile(file)) {
        showErrorToast(`Arquivo inválido. Use PNG, JPG, GIF ou WEBP (máx. ${MAX_SIZE_MB}MB).`);
        return;
      }

      setIsUploading(true);

      try {
        const url = await onUpload(file);
        onSuccess?.(url);
      } catch (err) {
        showErrorToast(err, { fallbackMessage: 'Erro ao enviar a imagem.' });
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, isUploading, onSuccess, onUpload],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  }, [disabled, isUploading]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handleFile(file);
      event.target.value = '';
    },
    [handleFile],
  );

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {imageUrl && onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled || isUploading}
            className="h-auto gap-1 px-2 text-xs font-normal text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Remover
          </Button>
        ) : null}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(event) => event.key === 'Enter' && handleClick()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'group relative overflow-hidden rounded-2xl border-2 border-dashed bg-muted/20 transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isDragging && 'scale-[1.01] border-primary bg-primary/10',
          !isDragging && 'border-border hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-60',
          isUploading && 'pointer-events-none',
        )}
      >
        <div className="relative aspect-[4/3] w-full">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Pré-visualização do produto" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
                <ImagePlus className="h-7 w-7 text-primary" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Clique ou arraste a imagem aqui</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF ou WEBP de até {MAX_SIZE_MB}MB</p>
              </div>
            </div>
          )}

          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-background/70 transition-opacity',
              imageUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
              isDragging && 'opacity-100',
            )}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <ImagePlus className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />
    </div>
  );
}
