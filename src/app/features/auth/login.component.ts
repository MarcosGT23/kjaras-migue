import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="shell">

      <!-- ══ BRAND PANEL ══ -->
      <div class="brand">
        <div class="brand-mesh"></div>

        <header class="brand-header">
          <div class="brand-logo">
            <mat-icon class="logo-icon">restaurant_menu</mat-icon>
          </div>
          <span class="brand-label">Kjaras POS</span>
        </header>

        <div class="brand-body">
          <h1 class="brand-h1">El sistema<br>que tu negocio<br>merece.</h1>
          <p class="brand-copy">Punto de venta inteligente, rápido y siempre disponible.</p>

          <div class="brand-cards">
            @for (f of features; track f.icon) {
              <div class="brand-card">
                <div class="brand-card-icon">
                  <mat-icon class="!text-[17px] !w-[17px] !h-[17px]">{{ f.icon }}</mat-icon>
                </div>
                <span>{{ f.label }}</span>
              </div>
            }
          </div>
        </div>

        <footer class="brand-footer">v2.0 · Kjaras © 2025</footer>
      </div>

      <!-- ══ FORM PANEL ══ -->
      <div class="form-side">
        <div class="form-box">

          <div class="form-top">
            <div class="form-icon">
              <mat-icon class="!text-[22px] !w-[22px] !h-[22px]" style="color:var(--mat-sys-primary)">lock_open</mat-icon>
            </div>
            <div>
              <h2 class="form-h2">Bienvenido de vuelta</h2>
              <p class="form-sub">Ingresa tus credenciales para continuar</p>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="error-box">
              <mat-icon class="!text-[16px] !w-[16px] !h-[16px] flex-shrink-0">error</mat-icon>
              {{ errorMsg() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" class="form-fields">

            <div class="flex flex-col gap-1.5 mb-1">
              <label class="text-sm font-semibold text-slate-700">Usuario <span class="text-red-500">*</span></label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-[20px] !w-[20px] !h-[20px]">person</mat-icon>
                <input type="text" formControlName="usuario" placeholder="tu.usuario" autocomplete="username"
                       class="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                       [class.border-red-400]="form.get('usuario')?.invalid && form.get('usuario')?.touched"
                       [class.focus:ring-red-500]="form.get('usuario')?.invalid && form.get('usuario')?.touched">
              </div>
              @if (form.get('usuario')?.invalid && form.get('usuario')?.touched) {
                <span class="text-xs text-red-500 font-medium">El usuario es requerido.</span>
              }
            </div>

            <div class="flex flex-col gap-1.5 mt-2">
              <label class="text-sm font-semibold text-slate-700">Contraseña <span class="text-red-500">*</span></label>
              <div class="relative">
                <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-[20px] !w-[20px] !h-[20px]">lock</mat-icon>
                <input [type]="hide() ? 'password' : 'text'" formControlName="password" placeholder="••••••••" autocomplete="current-password"
                       class="w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                       [class.border-red-400]="form.get('password')?.invalid && form.get('password')?.touched"
                       [class.focus:ring-red-500]="form.get('password')?.invalid && form.get('password')?.touched">
                <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center rounded-md transition-colors"
                        (click)="hide.set(!hide())">
                  <mat-icon class="!text-[20px] !w-[20px] !h-[20px]">{{ hide() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="text-xs text-red-500 font-medium">Debe tener al menos 4 caracteres.</span>
              }
            </div>

            <button class="w-full mt-4 h-12 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                    type="submit"
                    [disabled]="form.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="18" color="accent"></mat-spinner><span>Autenticando...</span>
              } @else {
                <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">login</mat-icon> <span>Ingresar al sistema</span>
              }
            </button>

          </form>

          <p class="security-note">
            <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">verified_user</mat-icon>
            Conexión cifrada · Supabase Auth
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Shell */
    .shell { display: flex; min-height: 100vh; background: #f0f4f8; }

    /* ═══ BRAND PANEL ═══ */
    .brand {
      display: none;
      @media (min-width: 900px) { display: flex; }
      flex-direction: column; width: 46%; flex-shrink: 0;
      background: linear-gradient(160deg, #0d2b7e 0%, #1565c0 45%, #1976d2 100%);
      position: relative; overflow: hidden; padding: 2.5rem;
    }

    /* Animated gradient mesh */
    .brand-mesh {
      position: absolute; inset: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 60% 50% at 10% 20%, rgba(255,255,255,.12) 0%, transparent 70%),
        radial-gradient(ellipse 40% 40% at 90% 80%, rgba(99,179,255,.18) 0%, transparent 70%),
        radial-gradient(ellipse 30% 30% at 50% 50%, rgba(255,255,255,.06) 0%, transparent 60%);
    }

    .brand-header { position: relative; display: flex; align-items: center; gap: .75rem; }
    .brand-logo {
      width: 40px; height: 40px; border-radius: 12px;
      background: rgba(255,255,255,.2);
      border: 1.5px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(8px);
    }
    .logo-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; color: #fff; }
    .brand-label { font-size: .85rem; font-weight: 700; color: rgba(255,255,255,.8); letter-spacing: .04em; }

    .brand-body { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; }

    .brand-h1 {
      font-size: clamp(2rem, 3.5vw, 3rem); font-weight: 900; line-height: 1.1;
      color: #fff; margin: 0 0 1rem; letter-spacing: -.03em;
    }
    .brand-copy { font-size: .95rem; color: rgba(255,255,255,.6); margin: 0 0 2.5rem; line-height: 1.7; }

    .brand-cards { display: flex; flex-direction: column; gap: .6rem; }
    .brand-card {
      display: flex; align-items: center; gap: .75rem;
      padding: .7rem 1rem; border-radius: 12px;
      background: rgba(255,255,255,.08);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.12);
      color: rgba(255,255,255,.85); font-size: .84rem; font-weight: 500;
      transition: background .2s;
    }
    .brand-card:hover { background: rgba(255,255,255,.14); }
    .brand-card-icon {
      width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
      background: rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,.9);
    }

    .brand-footer { font-size: .72rem; color: rgba(255,255,255,.3); position: relative; text-align: center; }

    /* ═══ FORM SIDE ═══ */
    .form-side {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 2rem; background: #f0f4f8;
    }

    .form-box {
      width: 100%; max-width: 400px;
      background: #fff;
      border-radius: 24px;
      padding: 2.25rem;
      box-shadow: 0 0 0 1px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.07), 0 20px 40px rgba(0,0,0,.06);
    }

    .form-top { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
    .form-icon {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      background: var(--mat-sys-primary-container, #d3e4ff);
      display: flex; align-items: center; justify-content: center;
    }
    .form-h2 { margin: 0 0 .2rem; font-size: 1.4rem; font-weight: 900; color: #0f172a; }
    .form-sub { margin: 0; font-size: .82rem; color: #64748b; }

    .error-box {
      display: flex; align-items: center; gap: .5rem;
      padding: .85rem 1rem; border-radius: 12px; margin-bottom: 1rem;
      background: #fef2f2; color: #b91c1c;
      font-size: .82rem; font-weight: 500;
    }

    .form-fields { display: flex; flex-direction: column; gap: 1rem; }

    .submit-btn {
      height: 50px !important; border-radius: 14px !important;
      font-size: .9rem !important; font-weight: 700 !important;
      width: 100% !important;
      display: flex !important; align-items: center !important;
      justify-content: center !important; gap: .4rem !important;
      letter-spacing: .01em !important;
      background: linear-gradient(135deg, var(--mat-sys-primary, #1565c0) 0%, #0d47a1 100%) !important;
      transition: opacity .15s, transform .1s !important;
    }
    .submit-btn:not(:disabled):hover { opacity: .9; transform: translateY(-1px); }
    .submit-btn:not(:disabled):active { transform: translateY(0); }

    .security-note {
      display: flex; align-items: center; justify-content: center; gap: .35rem;
      margin: 1.25rem 0 0; font-size: .74rem; color: #94a3b8;
    }
  `]
})
export class LoginComponent {
  private fb      = inject(FormBuilder);
  private router  = inject(Router);
  private auth    = inject(AuthService);

  hide    = signal(true);
  loading = signal(false);
  errorMsg = signal('');

  features = [
    { icon: 'point_of_sale', label: 'Registro de ventas en tiempo real' },
    { icon: 'receipt_long',  label: 'Historial y reportes de turno' },
    { icon: 'payments',      label: 'Efectivo, QR y tarjeta' },
  ];

  form = this.fb.group({
    usuario:  ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.errorMsg.set('');
    const { usuario, password } = this.form.value;
    try {
      const rol = await this.auth.login(usuario!, password!);
      await this.router.navigate(rol === 'admin' ? ['/admin/dashboard'] : ['/caja/apertura']);
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'Invalid login credentials': 'Usuario o contraseña incorrectos.',
        'USER_NOT_IN_TABLE': 'Este usuario no tiene acceso asignado.',
        'USER_BLOCKED': 'Este usuario está bloqueado. Contacte al administrador.',
        'Email not confirmed': 'La cuenta no ha sido confirmada.',
      };
      this.errorMsg.set(msgs[e?.message] ?? 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}