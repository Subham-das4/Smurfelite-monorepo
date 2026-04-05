import type { Metadata, NextPage } from 'next';
import ProductsPage from '@/components/pages/products/page';

export const metadata: Metadata = {
  title: 'Browse Game Accounts | SmurfElite',
  description:
    'Find premium ranked game accounts for CS2, Valorant, GTA V, League of Legends, Fortnite and more. Instant delivery, full access, lifetime warranty.',
};

const Products: NextPage = () => {
  return <ProductsPage />;
};

export default Products;
