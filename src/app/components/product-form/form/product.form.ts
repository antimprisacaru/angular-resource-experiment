import { FormControl, FormGroup, Validators } from '@angular/forms';

type ProductForm = {
  title: FormControl<string>;
  description: FormControl<string>;
  price: FormControl<number>;
  category: FormControl<string>;
  stock: FormControl<number>;
}

export function initProductForm(): FormGroup<ProductForm> {
  return new FormGroup<ProductForm>({
    title: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    description: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    price: new FormControl(0, { validators: [Validators.required, Validators.min(0)], nonNullable: true }),
    category: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    stock: new FormControl(0, { validators: [Validators.required, Validators.min(0)], nonNullable: true }),
  })
}
