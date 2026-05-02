import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/supabase.service';

// Angular Material 3 Modules
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-categoria-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-dark">

      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="modal-badge">
            <mat-icon>category</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">Nueva Categoría</h2>
            <p class="modal-subtitle">Crea un nuevo grupo para clasificar el menú</p>
          </div>
        </div>
        <button class="close-btn" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <form [formGroup]="categoriaForm" class="flex flex-col gap-5">

          <!-- Nombre -->
          <div class="field-group">
            <label class="field-label">Nombre de la Categoría</label>
            <div class="field-input-wrap">
              <mat-icon class="field-prefix-icon">label</mat-icon>
              <input class="field-input" formControlName="nombre"
                     placeholder="Ej: Kjaras, Postres..." autofocus>
            </div>
            @if (categoriaForm.get('nombre')?.hasError('required') && categoriaForm.get('nombre')?.touched) {
              <span class="field-error">El nombre es obligatorio</span>
            }
            @if (categoriaForm.get('nombre')?.hasError('minlength')) {
              <span class="field-error">Mínimo 3 caracteres</span>
            }
          </div>

          <!-- Descripción -->
          <div class="field-group">
            <label class="field-label">Descripción <span class="text-slate-600 normal-case font-normal">(Opcional)</span></label>
            <div class="field-input-wrap" style="align-items: flex-start; padding-top: 10px; padding-bottom: 10px;">
              <mat-icon class="field-prefix-icon mt-0.5">description</mat-icon>
              <textarea class="field-input" formControlName="descripcion" rows="2"
                        placeholder="Ej: Platos principales con carne de cerdo..."></textarea>
            </div>
          </div>

          <!-- Orden -->
          <div class="field-group">
            <label class="field-label">Orden de Visualización</label>
            <div class="field-input-wrap">
              <mat-icon class="field-prefix-icon">format_list_numbered</mat-icon>
              <input class="field-input" type="number" formControlName="orden" placeholder="1">
            </div>
            <span class="field-hint">Define en qué posición aparecerá en el menú (1 = primero)</span>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-ghost" mat-dialog-close [disabled]="isLoading()">Cancelar</button>
        <button
          class="btn-primary"
          [disabled]="categoriaForm.invalid || isLoading()"
          (click)="guardarCategoria()">
          @if (isLoading()) {
            <mat-spinner diameter="18"></mat-spinner>
            Guardando...
          } @else {
            <mat-icon class="btn-icon">save</mat-icon>
            Crear Categoría
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    .modal-dark {
      background: #1C1C24;
      width: 460px; max-width: 95vw;
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
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,.1);
    }
    .field-prefix-icon { font-size: 18px; width: 18px; height: 18px; color: #475569; flex-shrink: 0; }
    .field-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: .9rem; padding: 12px 0; resize: none;
    }
    .field-input::placeholder { color: #334155; }
    .field-error { font-size: .72rem; color: #f87171; }
    .field-hint  { font-size: .72rem; color: #475569; }

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
  `]
})
export class CategoriaModalComponent {
  public dialogRef = inject(MatDialogRef<CategoriaModalComponent>);
  private fb       = inject(FormBuilder);
  private supabase  = inject(SupabaseService);

  isLoading = signal(false);

  categoriaForm = this.fb.group({
    nombre:      ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    orden:       [1, [Validators.min(0)]]
  });

  async guardarCategoria() {
    if (this.categoriaForm.invalid) return;
    this.isLoading.set(true);
    try {
      const datos = this.categoriaForm.value;
      const nueva = await this.supabase.crearCategoria({
        nombre:      datos.nombre!,
        descripcion: datos.descripcion || undefined,
        orden:       datos.orden ?? 1
      });
      this.dialogRef.close({ exito: true, categoria: nueva });
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      alert('Hubo un error al crear la categoría.');
    } finally {
      this.isLoading.set(false);
    }
  }
}