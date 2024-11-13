import { Routes } from '@angular/router';

// Storing this into a variable for consistency across usages (e.g., state where it's read)
export const ProductId = 'productId';

export const routes: Routes = [
  {
    path: 'products/list',
    loadComponent: () => import('./product-list/product-list.page').then(c => c.ProductsPageComponent)
  },
  {
    path: `products/:${ProductId}`,
    loadComponent: () => import('./product-details/product-details.page').then(c => c.ProductDetailsComponent)
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  }
];
