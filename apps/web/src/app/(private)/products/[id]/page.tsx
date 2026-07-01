import { notFound } from 'next/navigation';
import { ProductForm } from '@/modules/catalog/components/product-form';
import { getProduct, listCategories } from '@/modules/catalog/data/catalog.api';

/** Edit product route (private). 404s when the product does not exist. */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
