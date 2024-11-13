import { Category } from './category.api';

export type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  rating: number;
  stock: number;
};

export type ProductInput = Omit<Product, 'id' | 'thumbnail' | 'rating'>;

export type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

export type ProductRequest = {
  skip: number;
  limit: number;
  category?: Category;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
};

export type ProductDeleteResult = Product & { isDeleted: boolean; deletedOn: string };
