import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { Product, ProductDeleteResult, ProductInput, ProductRequest, ProductsResponse } from '../api/product.api';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private http: HttpClient) {}

  getProducts(request?: ProductRequest): Observable<ProductsResponse> {
    if (!request) {
      // Nullable because products table component request doesn't fire right away
      return EMPTY;
    }

    let url = 'https://dummyjson.com/products';
    let params = new HttpParams().append('skip', request.skip.toString()).append('limit', request.limit.toString());

    // Add sorting if provided
    if (request.sortBy && request.order) {
      params = params.append('sortBy', request.sortBy).append('order', request.order || 'asc');
    }

    // Handle search
    if (request.search) {
      url = 'https://dummyjson.com/products/search';
      params = params.append('q', request.search);
    }

    // Handle category
    if (request.category) {
      url = `https://dummyjson.com/products/category/${request.category.slug}`;
    }

    return this.http.get<ProductsResponse>(url, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`https://dummyjson.com/products/${id}`);
  }

  createProduct(product: ProductInput): Observable<Product> {
    return this.http.post<Product>('https://dummyjson.com/products/add', product);
  }

  updateProduct(id: number, product: Partial<ProductInput>): Observable<Product> {
    return this.http.patch<Product>(`https://dummyjson.com/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<ProductDeleteResult> {
    return this.http.delete<ProductDeleteResult>(`https://dummyjson.com/products/${id}`);
  }
}
