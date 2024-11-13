import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { ProductsService } from '../services/product.service';
import { rxResource, toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { CategoryService } from '../services/category.service';
import { Category } from '../api/category.api';

@Injectable()
export class CategoryState {
  private readonly categoryService = inject(CategoryService);
  private readonly _selectedCategory = signal<Category | undefined>(undefined);
  private readonly _selectedCategory$ = toObservable(this._selectedCategory);

  private readonly categoriesResource = rxResource({
    loader: () => this.categoryService.getCategories(),
  });

  public categories = computed(() => this.categoriesResource.value() ?? []);
  public error = computed(() => this.categoriesResource.error());

  public set selectedCategory(category: Category | undefined) {
    this._selectedCategory.set(category);
  }

  public get selectedCategory(): Signal<Category | undefined> {
    return this._selectedCategory.asReadonly();
  }

  public get selectedCategory$(): Observable<Category | undefined> {
    return this._selectedCategory$;
  }

  public reload(): void {
    this.categoriesResource.reload();
  }
}
