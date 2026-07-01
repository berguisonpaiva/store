import { auth } from '@/lib/auth';
import { parsePositiveInt, parseString } from '@/modules/catalog/data/price';
import { InventoryMovementsList } from '@/modules/estoque/components/inventory-movements-list';
import {
  getInventoryBalance,
  isApiStatusError,
  listInventoryMovements,
  listInventoryVariationOptions,
} from '@/modules/estoque/data/inventory.api';
import type {
  InventoryBalanceDTO,
  InventoryMovementDTO,
} from '@/modules/estoque/data/types';
import type { PaginationMetaDTO } from '@/modules/catalog/data/types';

type SearchParams = Record<string, string | string[] | undefined>;

const EMPTY_META: PaginationMetaDTO = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

export default async function InventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const variationId = parseString(sp.variationId);
  const from = parseString(sp.from);
  const to = parseString(sp.to);
  const page = parsePositiveInt(sp.page, 1);
  const pageSize = parsePositiveInt(sp.pageSize, 20);

  const session = await auth();
  const role = session?.user?.role;
  const canAdjust = role === 'MASTER' || role === 'ADMIN';

  const variationOptions = await listInventoryVariationOptions();

  // Saldo and Saída dialogs need the current balance per variation; precompute
  // them server-side (the balance endpoint is server-only).
  const balanceEntries = await Promise.all(
    variationOptions.map(async (option) => {
      try {
        const balance = await getInventoryBalance(option.value);
        return [option.value, balance] as const;
      } catch (error) {
        if (isApiStatusError(error, 404)) {
          return [option.value, undefined] as const;
        }
        throw error;
      }
    }),
  );
  const balancesByVariationId = Object.fromEntries(balanceEntries) as Record<
    string,
    InventoryBalanceDTO | undefined
  >;

  let movements: InventoryMovementDTO[] = [];
  let meta = { ...EMPTY_META, page, pageSize };
  let variationMissing = false;

  if (variationId) {
    try {
      const result = await listInventoryMovements({
        variacaoId: variationId,
        page,
        pageSize,
        from,
        to,
      });
      movements = result.data;
      meta = result.meta;
    } catch (error) {
      if (isApiStatusError(error, 404)) {
        variationMissing = true;
      } else {
        throw error;
      }
    }
  }

  return (
    <InventoryMovementsList
      variationOptions={variationOptions}
      selectedVariationId={variationId}
      selectedFrom={from}
      selectedTo={to}
      movements={movements}
      meta={meta}
      variationMissing={variationMissing}
      balancesByVariationId={balancesByVariationId}
      canAdjust={canAdjust}
    />
  );
}
