import { ChangeDetectionStrategy, Component, input, computed, inject, viewChild, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCell,
  MatCell,
  MatHeaderRow,
  MatRow,
  MatNoDataRow,
  MatRowDef,
  MatHeaderRowDef,
  MatCellDef,
  MatHeaderCellDef,
} from '@angular/material/table';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { map, Observable, switchMap, startWith, debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';
import { ProductsService } from '../../services/product.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CategoryState } from '../../state/category.state';
import { RouterLink } from '@angular/router';

enum ProductTableColumns {
  ID = 'id',
  Title = 'title',
  Price = 'price',
  Category = 'category',
  Rating = 'rating',
  Stock = 'stock',
}

@Component({
  selector: 'app-products-table',
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    MatTable,
    MatSort,
    MatPaginator,
    MatProgressSpinner,
    FormsModule,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatButton,
    MatLabel,
    MatNoDataRow,
    MatRowDef,
    MatRow,
    MatHeaderRow,
    MatHeaderRowDef,
    MatCellDef,
    MatCell,
    MatHeaderCell,
    MatColumnDef,
    MatHeaderCellDef,
    MatSortHeader,
    RouterLink,
  ],
  template: `
    <div class="table-container">
      @if (productsResource.isLoading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="50" />
        </div>
      }

      <div class="mat-elevation-z8">
        <div class="table-header">
          <mat-form-field>
            <mat-label>Filter</mat-label>
            <input matInput [(ngModel)]="searchFilter" placeholder="Search products..." #input />
          </mat-form-field>

          <button
            mat-icon-button
            color="primary"
            (click)="productsResource.reload()"
            [disabled]="productsResource.isLoading()"
            matTooltip="Reload products"
          >
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        <table mat-table [dataSource]="data()" matSort>
          <!-- ID Column -->
          <ng-container [matColumnDef]="ProductTableColumns.ID">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
            <td mat-cell *matCellDef="let row">{{ row.id }}</td>
          </ng-container>

          <!-- Title Column -->
          <ng-container [matColumnDef]="ProductTableColumns.Title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
            <td mat-cell *matCellDef="let row">
              <a [routerLink]="['..', row.id]">{{ row.title }}</a>
            </td>
          </ng-container>

          <!-- Price Column -->
          <ng-container [matColumnDef]="ProductTableColumns.Price">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Price</th>
            <td mat-cell *matCellDef="let row">\${{ row.price }}</td>
          </ng-container>

          <!-- Category Column -->
          <ng-container [matColumnDef]="ProductTableColumns.Category">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
            <td mat-cell *matCellDef="let row">{{ row.category }}</td>
          </ng-container>

          <!-- Rating Column -->
          <ng-container [matColumnDef]="ProductTableColumns.Rating">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Rating</th>
            <td mat-cell *matCellDef="let row">{{ row.rating }}</td>
          </ng-container>

          <!-- Stock Column -->
          <ng-container [matColumnDef]="ProductTableColumns.Stock">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Stock</th>
            <td mat-cell *matCellDef="let row">{{ row.stock }}</td>
          </ng-container>

          <!-- Error Column -->
          <ng-container matColumnDef="error">
            <td mat-cell *matCellDef="let row" [attr.colspan]="displayedColumns.length">
              <div class="error-row">
                <mat-icon class="error-icon">error_outline</mat-icon>
                <span class="error-message">Failed to load products</span>
                <button mat-button color="primary" (click)="productsResource.reload()">
                  <mat-icon>refresh</mat-icon>
                  Retry
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>

          @if (productsResource.error()) {
            <tr mat-row *matRowDef="let row; columns: ['error']" class="error-row-wrapper"></tr>
          } @else {
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          }

          <!-- No Data Row -->
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="displayedColumns.length">No data matching the filter "{{ input.value }}"</td>
          </tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" [pageSize]="10" [length]="total()" aria-label="Select page of products" />
      </div>
    </div>
  `,
  styleUrl: './products-table.component.scss',
  animations: [trigger('fadeInOut', [state('void', style({ opacity: 0 })), transition('void <=> *', animate('200ms ease-in-out'))])],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsTableComponent {
  /*** Injectables ***/
  private readonly productsService = inject(ProductsService);
  private readonly categoryState = inject(CategoryState);

  /*** Signals ***/
  protected readonly searchFilter = signal<string>('');

  /*** Table ***/
  protected readonly displayedColumns = Object.values(ProductTableColumns);
  protected readonly ProductTableColumns = ProductTableColumns;

  /*** View queries ***/
  private readonly sortRef = viewChild.required(MatSort);
  private readonly paginatorRef = viewChild.required(MatPaginator);

  /*** Search, sort, pagination ***/
  private readonly search$ = toObservable(this.searchFilter).pipe(
    // Add debounce to prevent too many requests
    debounceTime(300),
    distinctUntilChanged(),
  );

  private readonly sort$ = toObservable(this.sortRef).pipe(
    switchMap((sort) => sort.sortChange),
    startWith({ active: '', direction: '' }),
  );

  private readonly page$ = toObservable(this.paginatorRef).pipe(
    switchMap((paginator) => paginator.page),
    map((page) => ({
      skip: page.pageIndex * page.pageSize,
      limit: page.pageSize,
    })),
    startWith({ skip: 0, limit: 10 }),
  );

  /*** Request aggregation ***/
  private readonly request$ = combineLatest([this.page$, this.categoryState.selectedCategory$, this.sort$, this.search$]).pipe(
    map(([page, category, sort, search]) => ({
      ...page,
      category,
      sortBy: sort.active || undefined,
      // Typing shenanigans because Direction also has '' type
      order: (sort.direction as 'asc' | 'desc') || undefined,
      search: search || undefined,
    })),
  );

  /*** Resource ***/
  protected readonly productsResource = rxResource({
    request: toSignal(this.request$),
    loader: ({ request }) => this.productsService.getProducts(request),
  });

  /*** Data ***/
  protected readonly data = computed(() => this.productsResource.value()?.products ?? []);
  protected readonly total = computed(() => this.productsResource.value()?.total);
}
