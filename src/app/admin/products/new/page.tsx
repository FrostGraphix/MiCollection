import React from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add New Product — MiCollections Admin Studio',
  description: 'Create and publish luxury products into the MiCollections catalog with instant profit margin calculations.',
};

export default function NewProductPage() {
  return <ProductForm mode="create" initialProduct={null} />;
}
