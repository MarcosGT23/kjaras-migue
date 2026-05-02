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
  selector: 'app-usuario-modal',
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
            <mat-icon>{{ isEditMode() ? 'manage_accounts' : 'person_add' }}</mat-icon>
          </div>
          <div>
            <h2 class="modal-title">{{ isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario / Cajero' }}</h2>
            <p class="modal-subtitle">{{ isEditMode() ? 'Modifica los datos del empleado' : 'Registra un nuevo acceso al sistema' }}</p>
          </div>
        </div>
        <button class="close-btn" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <form [formGroup]="usuarioForm" class="flex flex-col gap-5">

          <!-- Nombre completo -->
          <div class="field-group">
            <label class="field-label">Nombre Completo del Empleado</label>
            <div class="field-input-wrap">
              <mat-icon class="field-prefix-icon">badge</mat-icon>
              <input class="field-input" formControlName="nombre_completo"
                     placeholder="Ej: Juan Pérez" autofocus>
            </div>
            @if (usuarioForm.get('nombre_completo')?.hasError('required') && usuarioForm.get('nombre_completo')?.touched) {
              <span class="field-error">El nombre es obligatorio</span>
            }
          </div>

          <!-- Usuario + Contraseña -->
          <div class="section-label">Credenciales de Acceso</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div class="field-group">
              <label class="field-label">Usuario de Sistema</label>
              <div class="field-input-wrap">
                <mat-icon class="field-prefix-icon">account_circle</mat-icon>
                <input class="field-input" formControlName="username"
                       placeholder="Ej: juan.caja1" [readonly]="isEditMode()">
              </div>
              @if (isEditMode()) {
                <span class="field-hint">El nombre de usuario no se puede cambiar.</span>
              }
            </div>

            <div class="field-group">
              <label class="field-label">{{ isEditMode() ? 'Nueva Contraseña (Opc.)' : 'Contraseña' }}</label>
              <div class="field-input-wrap">
                <mat-icon class="field-prefix-icon">lock</mat-icon>
                <input class="field-input" formControlName="password"
                       [type]="hidePassword() ? 'password' : 'text'" placeholder="••••••••">
                <button type="button" class="toggle-pass-btn" (click)="togglePassword($event)">
                  <mat-icon class="scale-75">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

          </div>

          <!-- Rol + Sucursal -->
          <div class="section-label">Permisos y Asignación</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div class="field-group">
              <label class="field-label">Rol en el Sistema</label>
              <div class="field-select-wrap">
                <mat-icon class="field-prefix-icon">admin_panel_settings</mat-icon>
                <select class="field-select" formControlName="rol">
                  <option value="cajero">Cajero (Operativo)</option>
                  <option value="parrillero">Parrillero (Cocina)</option>
                  <option value="cocinero">Cocinero (Cocina)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Sucursal Asignada</label>
              <div class="field-select-wrap">
                <mat-icon class="field-prefix-icon">store</mat-icon>
                <select class="field-select" formControlName="sucursal_id">
                  <option [ngValue]="null">Ninguna (Acceso Global)</option>
                  @for (sucursal of sucursalesDisponibles; track sucursal.id) {
                    <option [ngValue]="sucursal.id">{{ sucursal.nombre }}</option>
                  }
                </select>
              </div>
            </div>

          </div>

          <!-- Toggle acceso -->
          <div class="dark-section">
            <mat-slide-toggle formControlName="activo" color="primary">
              <span class="text-sm font-semibold text-slate-300">
                {{ usuarioForm.get('activo')?.value ? 'Acceso Permitido' : 'Acceso Bloqueado' }}
              </span>
            </mat-slide-toggle>
            <p class="text-xs text-slate-600 mt-2 ml-14">
              {{ usuarioForm.get('activo')?.value
                ? 'Puede iniciar sesión y usar el sistema.'
                : 'No podrá entrar al sistema.' }}
            </p>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-ghost" mat-dialog-close [disabled]="isLoading()">Cancelar</button>
        <button
          class="btn-primary"
          [disabled]="usuarioForm.invalid || isLoading()"
          (click)="guardarUsuario()">
          @if (isLoading()) {
            <mat-spinner diameter="18"></mat-spinner>
            Procesando...
          } @else {
            <mat-icon class="btn-icon">save</mat-icon>
            {{ isEditMode() ? 'Actualizar Usuario' : 'Crear Usuario' }}
          }
        </button>
      </div>

    </div>
  `,
  styles: [`
    .modal-dark {
      background: #1C1C24;
      width: 580px; max-width: 95vw;
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
      background: linear-gradient(135deg, #0284c7, #0369a1);
      box-shadow: 0 4px 16px rgba(2,132,199,.3);
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

    .section-label {
      font-size: .7rem; font-weight: 700; color: #334155;
      text-transform: uppercase; letter-spacing: .1em;
      border-bottom: 1px solid #2D2D3D; padding-bottom: 8px;
    }

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
    .field-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: .9rem; padding: 12px 0;
    }
    .field-input::placeholder { color: #334155; }
    .field-input[readonly] { color: #64748b; cursor: not-allowed; }
    .field-select {
      flex: 1; background: transparent; border: none; outline: none;
      color: #e2e8f0; font-size: .9rem; padding: 12px 0; cursor: pointer;
    }
    .field-select option { background: #1C1C24; color: #e2e8f0; }
    .field-error { font-size: .72rem; color: #f87171; }
    .field-hint  { font-size: .72rem; color: #475569; }

    .toggle-pass-btn {
      width: 28px; height: 28px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; transition: color .15s;
    }
    .toggle-pass-btn:hover { color: #94a3b8; }

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
export class UsuarioModalComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<UsuarioModalComponent>);
  public data      = inject(MAT_DIALOG_DATA);
  private fb       = inject(FormBuilder);
  private supabase  = inject(SupabaseService);

  isLoading    = signal(false);
  isEditMode   = signal(false);
  hidePassword = signal(true);

  sucursalesDisponibles: any[] = [];

  usuarioForm = this.fb.group({
    id:              [null as string | null],
    nombre_completo: ['', Validators.required],
    username:        ['', Validators.required],
    password:        [''],
    rol:             ['cajero', Validators.required],
    sucursal_id:     [1 as number | null],
    activo:          [true]
  });

  ngOnInit() {
    if (this.data?.sucursales) this.sucursalesDisponibles = this.data.sucursales;

    if (this.data?.usuario) {
      this.isEditMode.set(true);
      this.usuarioForm.patchValue(this.data.usuario);
      this.usuarioForm.get('password')?.clearValidators();
      this.usuarioForm.get('username')?.clearValidators();
    } else {
      this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.usuarioForm.get('username')?.updateValueAndValidity();

    this.usuarioForm.get('rol')?.valueChanges.subscribe(rol => {
      const ctrl = this.usuarioForm.get('sucursal_id');
      if (rol === 'admin') { ctrl?.setValue(null); ctrl?.disable(); }
      else { ctrl?.enable(); }
    });
  }

  togglePassword(event: Event) { event.preventDefault(); this.hidePassword.set(!this.hidePassword()); }

  async guardarUsuario() {
    if (this.usuarioForm.invalid) return;
    this.isLoading.set(true);
    try {
      const datos = this.usuarioForm.getRawValue();
      if (this.isEditMode()) {
        if (!datos.id) throw new Error('No se encontró el ID del usuario para actualizar.');
        await this.supabase.actualizarEmpleado(datos.id, datos);
      } else {
        await this.supabase.registrarNuevoEmpleado(datos);
      }
      this.dialogRef.close({ exito: true });
    } catch (error: any) {
      console.error('Error al guardar el usuario:', error);
      alert(`Hubo un error: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}