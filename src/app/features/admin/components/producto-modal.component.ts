import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/supabase.service';

// Angular Material 3 Modules
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-dark">

      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="modal-badge" [class.modal-badge--edit]="isEditMode()">
            <mat-icon>{{ isEditMode() ? 'edit' : 'add_circle' }}</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">{{ isEditMode() ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
            <p class="modal-subtitle">{{ isEditMode() ? 'Modifica los datos del plato' : 'Agrega un nuevo plato al menú' }}</p>
          </div>
        </div>
        <button class="close-btn" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <form [formGroup]="productoForm" class="flex flex-col gap-5">

          <!-- Nombre -->
          <div class="field-group">
            <label class="field-label">Nombre del Producto</label>
            <div class="field-input-wrap">
              <mat-icon class="field-prefix-icon">fastfood</mat-icon>
              <input class="field-input" formControlName="nombre" placeholder="Ej: Kjara Mixta" autofocus>
            </div>
            @if (productoForm.get('nombre')?.hasError('required') && productoForm.get('nombre')?.touched) {
              <span class="field-error">El nombre es obligatorio</span>
            }
          </div>

          <!-- Grid: Categoría + Precio -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div class="field-group">
              <label class="field-label">Categoría</label>
              <div class="field-select-wrap">
                <mat-icon class="field-prefix-icon">category</mat-icon>
                <select class="field-select" formControlName="categoria_id">
                  <option [ngValue]="null" disabled>Seleccionar...</option>
                  @for (cat of categorias(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Precio Base</label>
              <div class="field-input-wrap">
                <span class="field-prefix-text">Bs.</span>
                <input class="field-input" type="number" formControlName="precio_base" placeholder="0.00" min="0" step="0.50">
              </div>
            </div>

          </div>

          <!-- Sucursal -->
          <div class="field-group">
            <label class="field-label">Sucursal de Inventario</label>
            <div class="field-select-wrap">
              <mat-icon class="field-prefix-icon">store</mat-icon>
              <select class="field-select" formControlName="sucursal_id">
                <option [ngValue]="null" disabled>Seleccionar...</option>
                @for (suc of sucursales(); track suc.id) {
                  <option [ngValue]="suc.id">{{ suc.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Stock + Toggle -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center dark-section">

            <div class="field-group m-0">
              <label class="field-label">Stock en Sucursal</label>
              <div class="field-input-wrap">
                <mat-icon class="field-prefix-icon">inventory</mat-icon>
                <input class="field-input" type="number" formControlName="stock_sucursal" placeholder="50" min="0">
              </div>
            </div>

            <div class="flex flex-col gap-1.5 pl-2">
              <mat-slide-toggle formControlName="activo" color="primary">
                <span class="text-sm font-semibold text-slate-300">
                  {{ productoForm.get('activo')?.value ? 'Visible en el Menú' : 'Oculto del Menú' }}
                </span>
              </mat-slide-toggle>
              <span class="text-xs text-slate-600 ml-14">
                {{ productoForm.get('activo')?.value ? 'Los cajeros pueden venderlo.' : 'Nadie podrá venderlo.' }}
              </span>
            </div>

          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-ghost" mat-dialog-close [disabled]="isLoading()">Cancelar</button>
        <button
          class="btn-primary"
          [disabled]="productoForm.invalid || isLoading()"
          (click)="guardarProducto()">
          @if (isLoading()) {
            <mat-spinner diameter="18"></mat-spinner>
            Guardando...
          } @else {
            <mat-icon class="btn-icon">save</mat-icon>
            {{ isEditMode() ? 'Actualizar Cambios' : 'Crear Producto' }}
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    .modal-dark {
      background: #1C1C24;
      width: 560px; max-width: 95vw;
      border-radius: 20px; overflow: hidden;
    }

    /* Header */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 22px 24px;
      background: #13131A;
      border-bottom: 1px solid #2D2D3D;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }

    .modal-badge {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: white;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      box-shadow: 0 4px 16px rgba(79,70,229,.35);
    }
    .modal-badge--edit {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      box-shadow: 0 4px 16px rgba(14,165,233,.3);
    }

    .modal-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
    .modal-subtitle { margin: 2px 0 0; font-size: .75rem; color: #64748b; }

    .close-btn {
      width: 36px; height: 36px; border-radius: 10px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; transition: background .15s, color .15s;
    }
    .close-btn:hover { background: rgba(255,255,255,.06); color: #e2e8f0; }

    /* Body */
    .modal-body { padding: 24px; }

    /* Fields */
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-size: .7rem; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: .08em;
    }
    .field-input-wrap, .field-select-wrap {
      display: flex; align-items: center; gap: 8px;
      background: #13131A; border: 1px solid #2D2D3D; border-radius: 12px;
      padding: 0 12px; transition: border-color .2s;
    }
    .field-input-wrap:focus-within, .field-select-wrap:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,.1);
    }
    .field-prefix-icon { font-size: 18px; width: 18px; height: 18px; color: #475569; flex-shrink: 0; }
    .field-prefix-text { font-size: .8rem; font-weight: 700; color: #475569; white-space: nowrap; }
    .field-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: .9rem; padding: 12px 0;
    }
    .field-input::placeholder { color: #334155; }
    .field-select {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: .9rem; padding: 12px 0; cursor: pointer;
    }
    .field-select option { background: #1C1C24; color: #e2e8f0; }
    .field-error { font-size: .72rem; color: #f87171; }

    /* Dark section (stock + toggle) */
    .dark-section {
      background: #13131A;
      border: 1px solid #2D2D3D;
      border-radius: 14px;
      padding: 16px;
    }

    /* Footer */
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px;
      background: #13131A;
      border-top: 1px solid #2D2D3D;
    }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 9px 20px; border-radius: 10px;
      background: transparent; border: 1px solid #2D2D3D;
      color: #64748b; font-size: .85rem; font-weight: 600; cursor: pointer;
      transition: border-color .15s, color .15s;
    }
    .btn-ghost:hover:not(:disabled) { border-color: #475569; color: #94a3b8; }
    .btn-ghost:disabled { opacity: .4; cursor: not-allowed; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 22px; border-radius: 10px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: .85rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(99,102,241,.25); transition: opacity .15s;
    }
    .btn-primary:hover:not(:disabled) { opacity: .9; }
    .btn-primary:disabled { opacity: .4; cursor: not-allowed; }
    .btn-icon { font-size: 17px; width: 17px; height: 17px; }

    /* Slide toggle text */
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch { flex-shrink: 0; }
  `]
})
export class ProductoModalComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ProductoModalComponent>);
  public data      = inject(MAT_DIALOG_DATA);
  private fb       = inject(FormBuilder);
  private supabase  = inject(SupabaseService);

  isLoading  = signal(false);
  isEditMode = signal(false);
  categorias = signal<any[]>([]);
  sucursales = signal<any[]>([]);

  productoForm = this.fb.group({
    id:              [null],
    nombre:          ['', Validators.required],
    categoria_id:    [null as number | null, Validators.required],
    precio_base:     [null, [Validators.required, Validators.min(0)]],
    sucursal_id:     [null as number | null, Validators.required],
    stock_sucursal:  [0, [Validators.required, Validators.min(0)]],
    activo:          [true]
  });

  async ngOnInit() {
    try {
      const [cats, sucs] = await Promise.all([
        this.supabase.getCategorias(),
        this.supabase.getSucursales()
      ]);
      this.categorias.set(cats || []);
      this.sucursales.set(sucs || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }

    if (this.data?.producto) {
      this.isEditMode.set(true);
      this.productoForm.patchValue(this.data.producto);
    } else {
      // Para nuevos productos, seleccionar la primera sucursal por defecto
      if (this.sucursales().length > 0) {
        this.productoForm.patchValue({ sucursal_id: this.sucursales()[0].id });
      }
    }
  }

  async guardarProducto() {
    if (this.productoForm.invalid) return;
    this.isLoading.set(true);
    try {
      const datos = this.productoForm.value;
      if (this.isEditMode()) {
        await this.supabase.actualizarProducto(datos.id!, {
          nombre: datos.nombre,
          precio_base: datos.precio_base,
          categoria_id: datos.categoria_id,
          activo: datos.activo
        });
      } else {
        await this.supabase.crearProducto(datos, datos.stock_sucursal!, datos.sucursal_id!);
      }
      this.dialogRef.close({ exito: true });
    } catch (error) {
      console.error('Error al guardar en Supabase:', error);
      alert('Error al guardar el producto en la nube.');
    } finally {
      this.isLoading.set(false);
    }
  }
}