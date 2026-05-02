import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/supabase.service';

// Angular Material 3 Modules
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-sucursal-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-dark">

      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="modal-badge" [class.modal-badge--edit]="isEditMode()">
            <mat-icon>{{ isEditMode() ? 'edit_location' : 'add_business' }}</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">{{ isEditMode() ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h2>
            <p class="modal-subtitle">{{ isEditMode() ? 'Actualiza los datos del local' : 'Registra una nueva ubicación' }}</p>
          </div>
        </div>
        <button class="close-btn" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <form [formGroup]="sucursalForm" class="flex flex-col gap-5">

          <!-- Nombre -->
          <div class="field-group">
            <label class="field-label">Nombre de la Sucursal</label>
            <div class="field-input-wrap">
              <mat-icon class="field-prefix-icon">store</mat-icon>
              <input class="field-input" formControlName="nombre"
                     placeholder="Ej: Sucursal Sur" autofocus>
            </div>
            @if (sucursalForm.get('nombre')?.hasError('required') && sucursalForm.get('nombre')?.touched) {
              <span class="field-error">El nombre es obligatorio</span>
            }
          </div>

          <!-- Dirección -->
          <div class="field-group">
            <label class="field-label">Dirección Física</label>
            <div class="field-input-wrap">
              <mat-icon class="field-prefix-icon">location_on</mat-icon>
              <input class="field-input" formControlName="direccion"
                     placeholder="Ej: Av. Santos Dumont 6to Anillo">
            </div>
            @if (sucursalForm.get('direccion')?.hasError('required') && sucursalForm.get('direccion')?.touched) {
              <span class="field-error">La dirección es obligatoria</span>
            }
          </div>

          <!-- Teléfono -->
          <div class="field-group">
            <label class="field-label">Teléfono de Contacto</label>
            <div class="field-input-wrap">
              <mat-icon class="field-prefix-icon">phone</mat-icon>
              <input class="field-input" formControlName="telefono"
                     placeholder="Ej: 77712345">
            </div>
          </div>

          <!-- Toggle activa -->
          <div class="dark-section">
            <mat-slide-toggle formControlName="activa" color="primary">
              <span class="text-sm font-semibold text-slate-300">
                {{ sucursalForm.get('activa')?.value ? 'Sucursal Operativa' : 'Sucursal Cerrada Temporalmente' }}
              </span>
            </mat-slide-toggle>
            <p class="text-xs text-slate-600 mt-2 ml-14">
              {{ sucursalForm.get('activa')?.value
                ? 'Los cajeros pueden abrir turnos aquí.'
                : 'Nadie podrá registrar ventas en esta sucursal.' }}
            </p>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-ghost" mat-dialog-close [disabled]="isLoading()">Cancelar</button>
        <button
          class="btn-amber"
          [disabled]="sucursalForm.invalid || isLoading()"
          (click)="guardarSucursal()">
          @if (isLoading()) {
            <mat-spinner diameter="18"></mat-spinner>
            Guardando...
          } @else {
            <mat-icon class="btn-icon">save</mat-icon>
            {{ isEditMode() ? 'Actualizar Datos' : 'Registrar Sucursal' }}
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    .modal-dark {
      background: #1C1C24;
      width: 500px; max-width: 95vw;
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
      background: linear-gradient(135deg, #d97706, #b45309);
      box-shadow: 0 4px 16px rgba(217,119,6,.35);
    }
    .modal-badge--edit {
      background: linear-gradient(135deg, #0284c7, #0369a1);
      box-shadow: 0 4px 16px rgba(2,132,199,.3);
    }

    .modal-title  { margin: 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; }
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

    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-size: .7rem; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: .08em;
    }
    .field-input-wrap {
      display: flex; align-items: center; gap: 8px;
      background: #13131A; border: 1px solid #2D2D3D; border-radius: 12px;
      padding: 0 12px; transition: border-color .2s;
    }
    .field-input-wrap:focus-within {
      border-color: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245,158,11,.1);
    }
    .field-prefix-icon { font-size: 18px; width: 18px; height: 18px; color: #475569; flex-shrink: 0; }
    .field-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: .9rem; padding: 12px 0;
    }
    .field-input::placeholder { color: #334155; }
    .field-error { font-size: .72rem; color: #f87171; }

    /* Dark section */
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

    .btn-amber {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 22px; border-radius: 10px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white; font-size: .85rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(217,119,6,.25); transition: opacity .15s;
    }
    .btn-amber:hover:not(:disabled) { opacity: .9; }
    .btn-amber:disabled { opacity: .4; cursor: not-allowed; }
    .btn-icon { font-size: 17px; width: 17px; height: 17px; }
  `]
})
export class SucursalModalComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<SucursalModalComponent>);
  public data      = inject(MAT_DIALOG_DATA);
  private fb       = inject(FormBuilder);
  private supabase  = inject(SupabaseService);

  isLoading  = signal(false);
  isEditMode = signal(false);

  sucursalForm = this.fb.group({
    id:        [null],
    nombre:    ['', Validators.required],
    direccion: ['', Validators.required],
    telefono:  [''],
    activa:    [true]
  });

  ngOnInit() {
    if (this.data?.sucursal) {
      this.isEditMode.set(true);
      this.sucursalForm.patchValue(this.data.sucursal);
    }
  }

  async guardarSucursal() {
    if (this.sucursalForm.invalid) return;
    this.isLoading.set(true);
    try {
      const datos = this.sucursalForm.value;
      if (this.isEditMode()) {
        await this.supabase.actualizarSucursal(datos.id!, datos);
      } else {
        await this.supabase.crearSucursal(datos);
      }
      this.dialogRef.close({ exito: true });
    } catch (error: any) {
      console.error('Error al guardar la sucursal:', error);
      alert(`Hubo un error: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}