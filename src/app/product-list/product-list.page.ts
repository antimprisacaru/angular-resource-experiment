import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { ProductsService } from '../services/product.service';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { ProductsTableComponent } from './components/products-table.component';
import { CategoryState } from '../state/category.state';
import { Category } from '../api/category.api';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [MatFormField, MatLabel, MatSelect, ProductsTableComponent, MatIcon, MatButton, MatOption, MatIcon, MatButton],
  template: `
    <div class="container">
      @if (error()) {
        <div class="error-container">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <span class="error-message">Failed to load categories</span>
          <button mat-button color="primary" (click)="reload()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      } @else {
        <mat-form-field>
          <mat-label>Select Category</mat-label>
          <mat-select [(value)]="selectedCategory">
            <mat-option [value]="undefined">All Categories</mat-option>
            @for (category of categories(); track category) {
              <mat-option [value]="category">{{ category.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <app-products-table />
      }
    </div>
  `,
  styleUrl: './product-list.page.scss',
  providers: [ProductsService, CategoryState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent {
  protected readonly selectedCategory = signal<Category | undefined>(undefined);

  /*** State ***/
  private readonly state = inject(CategoryState);

  protected readonly categories = this.state.categories;
  protected readonly error = this.state.error;

  /*** Methods ***/
  protected reload(): void {
    this.state.reload();
  }

  constructor() {
    effect(() => {
      // Letting the state know of the selected category without actually exposing the signal itself from state
      this.state.selectedCategory = this.selectedCategory();
    });
  }
}
