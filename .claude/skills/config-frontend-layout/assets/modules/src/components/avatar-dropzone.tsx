'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showErrorToast } from '@/lib/error-toast';
import { cn } from '@/lib/utils';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isValidImageFile(file: File): boolean {
  if (!ACCEPTED_TYPES.includes(file.type)) return false;
  const sizeMB = file.size / (1024 * 1024);
  return sizeMB <= MAX_SIZE_MB;
}

type AvatarDropzoneProps = {
  avatarUrl: string | null;
  userName: string;
  onUpload: (file: File) => Promise<string>;
  onSuccess?: (url: string) => void;
  disabled?: boolean;
  className?: string;
};

export function AvatarDropzone({
  avatarUrl,
  userName,
  onUpload,
  onSuccess,
  disabled = false,
  className,
}: AvatarDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled || isUploading) return;

      if (!isValidImageFile(file)) {
        showErrorToast(`Arquivo inválido. Use PNG, JPG ou WEBP (máx. ${MAX_SIZE_MB}MB).`);
        return;
      }

      setIsUploading(true);

      try {
        const url = await onUpload(file);
        onSuccess?.(url);
      } catch (err) {
        showErrorToast(err, { fallbackMessage: 'Erro ao enviar a foto.' });
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, isUploading, onUpload, onSuccess],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  }, [disabled, isUploading]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center justify-center rounded-full transition-all',
          'border-2 border-dashed',
          isDragging && 'border-primary bg-primary/10 scale-105',
          !isDragging && 'border-muted-foreground/30 hover:border-primary/50',
          disabled && 'opacity-60 cursor-not-allowed',
          isUploading && 'pointer-events-none',
        )}
        aria-label="Alterar foto do perfil"
      >
        <Avatar className="size-24 border-4 border-background shadow-lg">
          <AvatarImage src={avatarUrl ?? ''} alt={userName} className="object-cover" />
          <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-background/80 transition-opacity',
            isDragging || isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          {isUploading ? (
            <Loader2 className="size-8 animate-spin text-primary" />
          ) : (
            <ImagePlus className="size-8 text-primary" />
          )}
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

      <p className="text-center text-sm text-muted-foreground">Arraste uma imagem ou clique para selecionar</p>
    </div>
  );
}
