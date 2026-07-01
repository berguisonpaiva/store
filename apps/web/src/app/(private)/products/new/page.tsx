import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProductForm } from '@/modules/catalog/components/product-form';
import { listCategories } from '@/modules/catalog/data/catalog.api';

/**
 * New product route (private, ADMIN-only). On load, reads the session and
 * redirects any non-ADMIN to `/dashboard` before rendering (RN07) — defense in
 * depth over the authoritative backend `RolesGuard`. Loads categories for the
 * form's select.
 */
export default async function NewProductPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const categories = await listCategories();
  return <ProductForm categories={categories} />;
}
