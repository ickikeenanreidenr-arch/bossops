
import React from 'react';
import { Product, Member } from '../types.ts';
import DataCockpit from '../features/data-cockpit/index.tsx';

interface DataAnalysisProps {
  products: Product[];
  setProducts: (fn: (prev: Product[]) => Product[]) => void;
  members: Member[];
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ products, setProducts, members }) => {
  return <DataCockpit products={products} setProducts={setProducts} members={members} />;
};

export default DataAnalysis;
