import { NoSessionBlock } from '@/modules/vendas/components/no-session-block';
import { SaleScreen } from '@/modules/vendas/components/sale-screen';
import { StartSaleButton } from '@/modules/vendas/components/start-sale-button';
import {
  getOperatorOpenSession,
  getVenda,
  listVariationOptions,
} from '@/modules/vendas/data/vendas.api';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * PDV sale screen (private). Server Component: gates the screen on an open cash
 * session (RF — `NO_OPEN_CASH_SESSION` blocks selling), then either deep-links
 * to an in-progress sale (`?venda=<id>`) or offers to start a new one. The
 * autocomplete options (active variations) are loaded server-side with the
 * session Bearer token.
 */
export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getOperatorOpenSession();
  if (!session) {
    return <NoSessionBlock />;
  }

  const sp = await searchParams;
  const vendaId = typeof sp.venda === 'string' ? sp.venda : undefined;

  const options = await listVariationOptions();

  if (!vendaId) {
    return <StartSaleButton />;
  }

  const venda = await getVenda(vendaId);

  return <SaleScreen initialVenda={venda} variationOptions={options} />;
}
