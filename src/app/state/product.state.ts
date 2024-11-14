import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ProductsService } from '../services/product.service';
import { catchError, EMPTY, filter, finalize, map, Observable, take, tap } from 'rxjs';
import { Product, ProductDeleteResult, ProductInput } from '../api/product.api';
import { ProductId } from '../app.routes';

@Injectable()
export class ProductState {
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);

  private readonly productId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get(ProductId)),
      // This ensures that productId has a value
      filter(Boolean),
      // Casting it into number from string
      map((id) => Number(id)),
    ),
  );

  private productResource = rxResource({
    request: this.productId,
    loader: ({ request }) => this.productsService.getProduct(request),
  });

  /*** Mutation features - because we cannot use the resource ones ***/
  private readonly _mutationLoading = signal(false);
  private readonly _mutationError = signal<unknown>(undefined);

  /*** Public Data ***/
  public readonly data = this.productResource.value.asReadonly();
  // here we have to aggregate between the resource loading state as well as mutation ones
  public readonly loading = computed(() => this.productResource.isLoading() || this._mutationLoading());
  // quick aggregation, TBD which priority should be
  public readonly error = computed(() => this._mutationError() ?? this.productResource.error());

  /*** Methods ***/
  public reload(): void {
    this.productResource.reload();
  }

  public deleteProduct(): Observable<ProductDeleteResult> {
    const productId = this.productId();

    if (!productId) {
      // Handling undefined productId, eg. for creation page
      return EMPTY;
    }

    // Resetting the error state and setting loading to true
    this._mutationError.set(undefined);
    this._mutationLoading.set(true);

    return this.productsService.deleteProduct(productId).pipe(
      catchError((e) => {
        // Setting the mutation error
        this._mutationError.set(e);
        // Returning EMPTY because we want to break the stream
        return EMPTY;
      }),
      finalize(() => {
        // When stream finishes, loading will set to false
        this._mutationLoading.set(false);
      })
    );
  }

  public updateProduct(input: ProductInput): Observable<Product> {
    const productId = this.productId();

    if (!productId) {
      // Handling undefined productId, eg. for creation page
      return EMPTY;
    }

    // Resetting the error state and setting loading to true
    this._mutationError.set(undefined);
    this._mutationLoading.set(true);

    return this.productsService.updateProduct(productId, input).pipe(
      take(1),
      catchError((e) => {
        // Setting the mutation error
        this._mutationError.set(e);
        // Returning EMPTY because we want to break the stream
        return EMPTY;
      }),
      // Changing the state without an actual refresh
      tap((result) => this.productResource.update(oldProduct => ({ ...oldProduct, ...result }))),
      finalize(() => {
        // When stream finishes, loading will set to false
        this._mutationLoading.set(false);
      })
    );
  }

  public createProduct(input: ProductInput): Observable<Product> {
    // Resetting the error state and setting loading to true
    this._mutationError.set(undefined);
    this._mutationLoading.set(true);

    return this.productsService.createProduct(input).pipe(
      take(1),
      catchError((e) => {
        // Setting the mutation error
        this._mutationError.set(e);
        // Returning EMPTY because we want to break the stream
        return EMPTY;
      }),
      // Changing the state without an actual refresh
      tap((result) => this.productResource.update(oldProduct => ({ ...oldProduct, ...result }))),
      finalize(() => {
        // When stream finishes, loading will set to false
        this._mutationLoading.set(false);
      })
    );
  }
}
