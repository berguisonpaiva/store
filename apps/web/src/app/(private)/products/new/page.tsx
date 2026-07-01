import { ProductForm } from '@/modules/catalog/components/product-form';
import { listCategories } from '@/modules/catalog/data/catalog.api';

/** New product route (private). Loads categories for the form's select. */
export default async function NewProductPage() {
  const categories = await listCategories();
  return <ProductForm categories={categories} />;
}
