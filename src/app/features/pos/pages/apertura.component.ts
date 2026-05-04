import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CajaService } from '../../../core/caja.service';
import { AuthService } from '../../../core/auth.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-apertura',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule],
  template: `
    <div class="shell apple-font">
      <div class="form-container">

        <!-- Caja YA abierta -->
        @if (cajaService.cajaAbierta()) {
          <div class="already-open">
            <div class="icon-circle icon-circle--green">
              <mat-icon class="!text-[28px]" style="color:#34C759">lock_open</mat-icon>
            </div>
            <h1 class="page-title">Caja Abierta</h1>
            <p class="page-subtitle">
              El turno ya está en curso desde las
              <strong>{{ horaApertura() }}</strong>.
            </p>
            <div class="info-pill">
              <mat-icon class="!text-[16px]">payments</mat-icon>
              Monto inicial: <strong>Bs. {{ cajaService.montoInicial() | number:'1.2-2' }}</strong>
            </div>
            <button class="sys-btn sys-btn--active mt-4" (click)="irAVenta()">
              <mat-icon class="!text-[18px]">point_of_sale</mat-icon>
              <span>Ir a Caja</span>
            </button>
          </div>
        }

        <!-- Abrir caja nueva -->
        @if (!cajaService.cajaAbierta()) {
          <div class="welcome-header">
            <div class="icon-circle">
              <mat-icon class="!text-[28px]" style="color:#007AFF">wb_sunny</mat-icon>
            </div>
            <h1 class="page-title">Apertura de Turno</h1>
            <p class="page-subtitle">Ingresa el saldo en efectivo con el que iniciarás las operaciones de hoy.</p>
          </div>

          @if (err()) {
            <div class="error-banner">
              <mat-icon class="!text-[18px]">error_outline</mat-icon>
              <span>{{ err() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="open()" class="ios-form">
            <div class="form-group">
              <label class="ios-label">MONTO INICIAL EN CAJA</label>
              <div class="input-wrapper">
                <span class="currency-symbol">Bs.</span>
                <input type="number" formControlName="monto" min="0" placeholder="0.00"
                       (focus)="$any($event.target).select()"
                       class="ios-input"
                       [class.input-error]="form.get('monto')?.invalid && form.get('monto')?.touched">
              </div>
              @if (form.get('monto')?.invalid && form.get('monto')?.touched) {
                <span class="error-text">Requerido. Ingresa un monto mayor o igual a 0.</span>
              }
            </div>

            <div class="hint-text">
              <mat-icon class="!text-[14px]">info</mat-icon>
              Este registro aparecerá en el arqueo final.
            </div>

            <button class="sys-btn" type="submit" [disabled]="loading() || form.invalid"
                    [class.sys-btn--active]="form.valid && !loading()">
              @if (loading()) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
              }
              @else {
                <mat-icon class="!text-[18px]">lock_open</mat-icon>
                <span>Abrir Caja</span>
              }
            </button>
          </form>
        }

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
      padding: 32px 32px 40px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.04);
      display: flex; flex-direction: column;
    }

    /* Caja ya abierta */
    .already-open {
      display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;
    }
    .info-pill {
      display: flex; align-items: center; gap: 8px; background: #E5F4EA;
      color: #1C1C1E; padding: 10px 20px; border-radius: 40px;
      font-size: 0.95rem; font-weight: 500; margin-top: 4px;
    }
    .mt-4 { margin-top: 16px; }

    .welcome-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 32px; }
    .icon-circle {
      width: 64px; height: 64px; border-radius: 32px; background: #E5F0FF;
      display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
    }
    .icon-circle--green { background: #E5F4EA; }
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
      transition: background 0.2s, border-color 0.2s; outline: none;
    }
    .ios-input:focus { background: #FFFFFF; border-color: #007AFF; box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1); }
    .input-error { border-color: #FF3B30 !important; background: #FFFFFF; }
    .error-text { display: block; color: #FF3B30; font-size: 0.8rem; font-weight: 500; margin: 6px 0 0 8px; }

    .hint-text {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      font-size: 0.8rem; color: #8E8E93; margin: 16px 0 32px;
    }

    .sys-btn {
      width: 100%; height: 50px; border-radius: 14px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 1.05rem; font-weight: 600; letter-spacing: 0.01em;
      background: #E5E5EA; color: #8E8E93;
      transition: all 0.2s;
    }
    .sys-btn--active { background: #007AFF; color: #FFFFFF; }
    .sys-btn--active:active { transform: scale(0.97); opacity: 0.9; }
  `]
})
export class AperturaComponent implements OnInit {
  private router = inject(Router);
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  cajaService    = inject(CajaService);

  loading = signal(false);
  err     = signal('');

  form = this.fb.group({ monto: [0, [Validators.required, Validators.min(0)]] });

  horaApertura() {
    const h = this.cajaService.horaApertura();
    if (!h) return '—';
    return new Date(h).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  }

  async ngOnInit() {
    // Verificar contra la DB si hay caja abierta para esta sucursal
    const sucursalId = this.auth.userSucursal() || 1;
    await this.cajaService.init(sucursalId);
  }

  irAVenta() { this.router.navigate(['/caja/venta']); }

  async open() {
    if (this.form.invalid) return;
    this.loading.set(true); this.err.set('');
    try {
      const sucursalId = this.auth.userSucursal() || 1;
      const monto      = this.form.value.monto ?? 0;
      await this.cajaService.abrirCaja(sucursalId, monto);
      this.router.navigate(['/caja/venta']);
    } catch (e: any) {
      this.err.set(e?.message || 'Error al abrir la caja. Intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
