import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton } from '@angular/material/button';
import { initProductForm } from './form/product.form';
import { iif, take } from 'rxjs';
import { CategoryState } from '../../state/category.state';
import { Product, ProductInput } from '../../api/product.api';
import { ProductState } from '../../state/product.state';
import { Category } from '../../api/category.api';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatSelect, MatButton, MatOption, MatError, MatDialogClose],
  template: `
    <div class="form-container">
      <h2>{{ product ? 'Edit' : 'Create' }} Product</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field>
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" required />
          @if (form.controls.title.hasError('required') && form.controls.title.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" required rows="4"></textarea>
          @if (form.controls.description.hasError('required') && form.controls.description.touched) {
            <mat-error>Description is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Price</mat-label>
          <input matInput type="number" formControlName="price" required />
          @if (form.controls.price.hasError('required') && form.controls.price.touched) {
            <mat-error>Price is required</mat-error>
          }
          @if (form.controls.price.errors?.['min']) {
            <mat-error>Price must be greater than 0</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Category</mat-label>
          <mat-select formControlName="category" required [compareWith]="categoryCompareWith">
            @for (category of categories(); track category) {
              <mat-option [value]="category">{{ category.name }}</mat-option>
            }
          </mat-select>
          @if (form.controls.category.hasError('required') && form.controls.category.touched) {
            <mat-error>Category is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Stock</mat-label>
          <input matInput type="number" formControlName="stock" required />
          @if (form.controls.stock.hasError('required') && form.controls.stock.touched) {
            <mat-error>Stock is required</mat-error>
          }
          @if (form.controls.stock.errors?.['min']) {
            <mat-error>Stock must be 0 or greater</mat-error>
          }
        </mat-form-field>

        <div class="form-actions">
          <button mat-button type="button" mat-dialog-close>Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading()">
            {{ product ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>

      @if (error()) {
        <div class="error-message">
          {{ error() }}
        </div>
      }
    </div>
  `,
  styleUrl: 'product-form.component.scss',
  providers: [CategoryState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent {
  private readonly productState = inject(ProductState);
  private readonly categoryState = inject(CategoryState);
  protected readonly dialogRef = inject(MatDialogRef<ProductFormComponent>);

  /*** Exposed variables ***/
  protected readonly form = initProductForm();
  protected readonly categories = this.categoryState.categories;
  protected readonly loading = this.productState.loading;
  protected readonly error = this.productState.error;

  constructor(@Inject(MAT_DIALOG_DATA) protected product: Product | undefined) {
    if (product) {
      this.form.patchValue({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    const input: ProductInput = this.form.getRawValue();

    // We can use iif for conditional stream branching - if there is a product, we must update; otherwise create.
    iif(() => !!this.product, this.productState.updateProduct(input), this.productState.createProduct(input)).subscribe((result) => {
      this.dialogRef.close(result);
    });
  }

  protected readonly categoryCompareWith = (a: Category, b: Category): boolean => a.slug === b.slug;
}
