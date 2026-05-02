import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CajaService } from '../../../core/caja.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-cierre',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule],
  template: `
    <div class="shell apple-font">
      <div class="form-container">

        <!-- Header -->
        <div class="welcome-header">
          <div class="icon-circle">
            <mat-icon class="!text-[28px]" style="color:#FF3B30">lock_outline</mat-icon>
          </div>
          <h1 class="page-title">Cerrar Turno</h1>
          <p class="page-subtitle">Realiza el arqueo ciego. Ingresa el efectivo físico en tu caja sin consultar el sistema.</p>
        </div>

        @if (err()) {
          <div class="error-banner">
            <mat-icon class="!text-[18px]">error_outline</mat-icon>
            <span>{{ err() }}</span>
          </div>
        }

        <form [formGroup]="form" class="ios-form">
          <div class="form-group">
            <label class="ios-label">EFECTIVO CONTADO EN CAJA</label>
            <div class="input-wrapper">
              <span class="currency-symbol">Bs.</span>
              <input type="number" formControlName="monto" min="0" placeholder="0.00" 
                     (focus)="$any($event.target).select()"
                     class="ios-input"
                     [class.input-error]="form.get('monto')?.invalid && form.get('monto')?.touched">
            </div>
            @if (form.get('monto')?.invalid && form.get('monto')?.touched) {
              <span class="error-text">Requerido. Ingresa el monto contado.</span>
            }
          </div>
        </form>

        <div class="hint-text">
          <mat-icon class="!text-[14px]">info</mat-icon>
          El sistema calculará las diferencias al cerrar.
        </div>

        <!-- Acciones -->
        <div class="action-buttons">
          <button class="sys-btn sys-btn--secondary" (click)="router.navigate(['/caja/venta'])">
            Volver
          </button>
          
          <button class="sys-btn sys-btn--danger" [disabled]="loading() || form.invalid" 
                  [class.opacity-50]="form.invalid" (click)="cerrar()">
            @if (loading()) { 
              <mat-spinner diameter="20" color="accent"></mat-spinner>
            }
            @else { 
              <mat-icon class="!text-[20px]">lock</mat-icon> Confirmar
            }
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .apple-font {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :host { display: block; height: 100%; overflow-y: auto; background: #F2F2F7; }
    
    .shell { 
      display: flex; min-height: 100%; align-items: center; justify-content: center; 
      padding: 20px; 
    }

    .form-container {
      width: 100%; max-width: 440px; background: #FFFFFF; border-radius: 20px;
      padding: 32px 32px 32px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.04);
      display: flex; flex-direction: column;
    }

    .welcome-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 24px; }
    .icon-circle {
      width: 64px; height: 64px; border-radius: 32px; background: #FFE5E5;
      display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
    }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #000000; margin: 0 0 8px; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.95rem; color: #8E8E93; margin: 0; line-height: 1.4; }

    .error-banner {
      display: flex; align-items: center; gap: 8px; background: #FFE5E5; color: #FF3B30;
      padding: 12px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: 500;
      margin-bottom: 24px;
    }

    .ios-form { display: flex; flex-direction: column; }

    .form-group { margin-bottom: 12px; }
    .ios-label { 
      display: block; font-size: 0.75rem; font-weight: 600; color: #8E8E93; 
      margin-bottom: 8px; margin-left: 8px; letter-spacing: 0.04em;
    }
    
    .input-wrapper { position: relative; }
    .currency-symbol {
      position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
      font-size: 1.2rem; font-weight: 600; color: #8E8E93;
    }
    .ios-input {
      width: 100%; padding: 16px 16px 16px 48px;
      background: #F2F2F7; border: 1.5px solid transparent; border-radius: 14px;
      font-size: 1.2rem; font-weight: 700; color: #000000;
      transition: background 0.2s, border-color 0.2s;
      outline: none;
    }
    .ios-input:focus { background: #FFFFFF; border-color: #FF3B30; box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.1); }
    .input-error { border-color: #FF3B30 !important; background: #FFFFFF; }
    
    .error-text { display: block; color: #FF3B30; font-size: 0.8rem; font-weight: 500; margin: 6px 0 0 8px; }

    .hint-text {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      font-size: 0.8rem; color: #8E8E93; margin: 16px 0 32px; text-align: center;
    }

    .action-buttons { display: flex; gap: 12px; }

    .sys-btn {
      flex: 1; height: 50px; border-radius: 14px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 1rem; font-weight: 600; letter-spacing: 0.01em;
      transition: all 0.2s;
    }
    .sys-btn:active { transform: scale(0.97); }

    .sys-btn--secondary { background: #E5E5EA; color: #1C1C1E; }
    .sys-btn--secondary:hover { background: #D1D1D6; }
    
    .sys-btn--danger { background: #FF3B30; color: #FFFFFF; flex: 1.5;}
    .sys-btn--danger:active { opacity: 0.9; }
  `]
})
export class CierreComponent {
  router     = inject(Router);
  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);

  loading = signal(false);
  err     = signal('');

  form = this.fb.group({ monto: [null as number|null, [Validators.required, Validators.min(0)]] });

  async cerrar() {
    if (this.form.invalid) return;
    this.loading.set(true); this.err.set('');
    try { 
      await new Promise(r => setTimeout(r, 900)); 
      this.cajaService.cerrarCaja();
      this.router.navigate(['/login']); 
    }
    catch { this.err.set('Error al cerrar turno. Intenta de nuevo.'); }
    finally { this.loading.set(false); }
  }
}
