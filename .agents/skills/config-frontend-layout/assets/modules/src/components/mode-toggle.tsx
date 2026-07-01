'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeMenuItems({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenuGroup className={className}>
      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Aparência</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2">
        <Sun className="size-4" />
        <span>Claro</span>
        {theme === 'light' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2">
        <Moon className="size-4" />
        <span>Escuro</span>
        {theme === 'dark' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2">
        <Monitor className="size-4" />
        <span>Sistema</span>
        {theme === 'system' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export function ModeToggle() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  const isDark = resolvedTheme === 'dark';

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl p-2.5 text-muted-foreground">
        <Sun className="size-6" />
        <span className="sr-only">Alternar tema</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
          />
        }
      >
        <Sun
          className={`size-6 transition-all ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        />
        <Moon
          className={`absolute size-6 transition-all ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
        />
        <span className="sr-only">Alternar tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <ThemeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
