import { Card } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { LowStockList } from '@/modules/estoque/components/low-stock-list';
import {
  isApiStatusError,
  listInventoryVariationOptions,
  listLowStockItems,
} from '@/modules/estoque/data/inventory.api';
import type { InventoryLowStockItemDTO } from '@/modules/estoque/data/types';

/**
 * Dashboard (rota `/dashboard`, grupo private).
 *
 * Renderizado dentro do AdminShell. Inclui o widget de estoque abaixo do mínimo,
 * restrito a perfil ADMIN — usuários sem acesso não o veem.
 */
export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  const canViewLowStock = role === 'ADMIN';

  let lowStockItems: InventoryLowStockItemDTO[] = [];
  let lowStockForbidden = false;
  let variationOptions: Awaited<ReturnType<typeof listInventoryVariationOptions>> = [];

  if (canViewLowStock) {
    variationOptions = await listInventoryVariationOptions();
    try {
      lowStockItems = await listLowStockItems();
    } catch (error) {
      if (isApiStatusError(error, 403)) {
        lowStockForbidden = true;
      } else {
        throw error;
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da aplicação.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['Métrica A', 'Métrica B', 'Métrica C'].map((title) => (
          <Card key={title} className="p-6">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold">—</p>
          </Card>
        ))}
      </div>

      {canViewLowStock ? (
        <LowStockList
          items={lowStockItems}
          variationOptions={variationOptions}
          forbidden={lowStockForbidden}
        />
      ) : null}
    </div>
  );
}
