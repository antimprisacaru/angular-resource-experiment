import { ChangeDetectionStrategy, Component, computed, inject, Injector } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton, MatIconAnchor, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ProductsService } from '../services/product.service';
import { ConfirmDialogComponent } from '../components/dialogs/confirmation.dialog';
import { filter, map, switchMap, take, tap } from 'rxjs';
import { ProductFormComponent } from '../components/product-form/product-form.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ProductState } from '../state/product.state';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatButton, MatIcon, MatProgressSpinner, MatIconButton, RouterLink, MatIconAnchor],
  template: `
    <div class="container">
      @if (isLoading()) {
        <mat-progress-spinner mode="indeterminate" />
      } @else if (error()) {
        <div class="error-container">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <span class="error-message">Failed to load product</span>
          <button mat-button color="primary" (click)="reload()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      } @else {
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ product()?.title }}</mat-card-title>
            <div class="header-actions">
              <a mat-icon-button [routerLink]="['..', 'list']">
                <mat-icon>arrow_back</mat-icon>
              </a>
              <button mat-icon-button color="primary" (click)="editProduct()">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteProduct()">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div class="product-details">
              <div class="detail-row">
                <strong>Price:</strong>
                <span>\${{ product()?.price }}</span>
              </div>
              <div class="detail-row">
                <strong>Category:</strong>
                <span>{{ product()?.category }}</span>
              </div>
              <div class="detail-row">
                <strong>Rating:</strong>
                <span>{{ product()?.rating }}</span>
              </div>
              <div class="detail-row">
                <strong>Stock:</strong>
                <span>{{ product()?.stock }}</span>
              </div>
              <div class="detail-row">
                <strong>Description:</strong>
                <p>{{ product()?.description }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styleUrl: 'product-details.page.scss',
  providers: [ProductState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsComponent {
  private readonly state = inject(ProductState);
  private readonly injector = inject(Injector);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  protected readonly product = this.state.data;
  protected readonly isLoading = this.state.loading;
  protected readonly error = this.state.error;

  editProduct(): void {
    this.dialog
      .open(ProductFormComponent, {
        data: { ...this.product() },
        width: '600px',
        // ATTENTION: passing the injector is very important to preserve the same state instance (for accessing the ID for example)
        injector: this.injector,
      })
      .afterClosed()
      .pipe(
        take(1),
        filter(Boolean),
        tap(() => this.state.reload()),
      )
      .subscribe();
  }

  deleteProduct(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Product',
          message: 'Are you sure you want to delete this product?',
        },
        injector: this.injector,
      })
      .afterClosed()
      .pipe(
        take(1),
        filter(Boolean),
        switchMap(() => this.state.deleteProduct()),
      )
      .subscribe(() => {
        this.router.navigate(['..', 'list'], { relativeTo: this.route });
      });
  }

  protected reload(): void {
    this.state.reload();
  }
}
