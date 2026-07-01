import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProductForm } from '@/modules/catalog/components/product-form';
import { getProduct, listCategories } from '@/modules/catalog/data/catalog.api';

/**
 * Edit product route (private, ADMIN-only). On load, reads the session and
 * redirects any non-ADMIN to `/dashboard` before rendering (RN07) — defense in
 * depth over the authoritative backend `RolesGuard`. 404s when the product does
 * not exist.
 */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;

  try {
    const [product, categories] = await Promise.all([
      getProduct(id),
      listCategories(),
    ]);
    return <ProductForm product={product} categories={categories} />;
  } catch {
    notFound();
  }
}
