import {
  Component, inject, signal, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const NAV = [
  { path: '/admin/dashboard',  icon: 'dashboard',        label: 'Dashboard'  },
  { path: '/admin/ventas',     icon: 'point_of_sale',    label: 'Ventas'     },
  { path: '/admin/inventario', icon: 'inventory_2',       label: 'Inventario' },
  { path: '/admin/usuarios',   icon: 'manage_accounts',   label: 'Usuarios'   },
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatRippleModule, MatProgressSpinnerModule],
  template: `
    <div class="app-shell">

      <!-- ══ DARK NAV RAIL (Desktop) ══ -->
      <nav class="rail" [class.rail--sm]="sm()">

        <!-- Brand -->
        <div class="rail-brand" [class.rail-brand--sm]="sm()">
          <div class="brand-mark">
            <mat-icon class="!text-white !text-[20px]">admin_panel_settings</mat-icon>
          </div>
          @if (!sm()) {
            <div class="brand-text">
              <span class="brand-name">Kjaras</span>
              <span class="brand-tag">Admin 2.0</span>
            </div>
          }
        </div>

        <div class="rail-sep"></div>

        <!-- Main nav -->
        <div class="rail-nav">
          @for (item of nav; track item.path) {
            <a class="nav-btn" matRipple
               [routerLink]="item.path" routerLinkActive="nav-btn--on"
               [matTooltip]="sm() ? item.label : ''" matTooltipPosition="right">
              <div class="nav-pill">
                <mat-icon class="!text-[20px]">{{ item.icon }}</mat-icon>
              </div>
              @if (!sm()) { <span class="nav-label">{{ item.label }}</span> }
            </a>
          }
        </div>

        <div class="rail-fill"></div>
        <div class="rail-sep"></div>

        <!-- Bottom nav logout -->
        <div class="rail-nav rail-nav--bottom">
          <button class="nav-btn nav-btn--ghost" matRipple (click)="confirmLogout()"
                  [matTooltip]="sm() ? 'Salir' : ''" matTooltipPosition="right">
            <div class="nav-pill"><mat-icon class="!text-[20px]">logout</mat-icon></div>
            @if (!sm()) { <span class="nav-label">Cerrar Sesión</span> }
          </button>
        </div>
      </nav>

      <!-- ══ MAIN AREA ══ -->
      <div class="main">

        <!-- ── Topbar ── -->
        <header class="topbar">
          <!-- Toggle (desktop only) -->
          <button class="toggle-btn desktop-only" (click)="sm.set(!sm())" matRipple>
            <mat-icon class="!text-[22px]">{{ sm() ? 'menu' : 'menu_open' }}</mat-icon>
          </button>

          <!-- Brand (mobile only) -->
          <div class="mobile-brand mobile-only">
            <div class="brand-mark-sm">
              <mat-icon class="!text-white !text-[16px]">admin_panel_settings</mat-icon>
            </div>
            <span class="mobile-brand-name">Kjaras</span>
          </div>

          <span class="topbar-title">Panel de Administración</span>
          <div class="topbar-spacer"></div>

          <!-- Live indicator (desktop) -->
          <div class="live-badge desktop-only">
            <span class="live-dot"></span>
            <span class="live-label">En línea</span>
          </div>

          <!-- User chip -->
          <div class="user-chip">
            <div class="user-avatar">
              <mat-icon class="!text-[16px]">admin_panel_settings</mat-icon>
            </div>
            <div class="user-info">
              <span class="user-name">Administrador</span>
              <span class="user-role">Acceso total</span>
            </div>
          </div>

          <!-- Logout mobile -->
          <button class="logout-mobile-btn mobile-only" (click)="confirmLogout()">
            <mat-icon class="!text-[20px]">logout</mat-icon>
          </button>
        </header>

        <main class="page-area">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- ══ BOTTOM NAV (Mobile) ══ -->
      <nav class="bottom-nav">
        @for (item of nav; track item.path) {
          <a class="bn-item" matRipple
             [routerLink]="item.path" routerLinkActive="bn-item--on">
            <mat-icon class="bn-icon">{{ item.icon }}</mat-icon>
            <span class="bn-label">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- ══ LOGOUT CONFIRMATION MODAL ══ -->
      @if (showLogoutModal()) {
        <div class="logout-overlay" (click)="cancelLogout()">
          <div class="logout-modal" (click)="$event.stopPropagation()">

            <div class="logout-icon-wrap">
              <div class="logout-icon-ring"></div>
              <mat-icon class="logout-icon">logout</mat-icon>
            </div>

            <h3 class="logout-title">¿Cerrar sesión?</h3>
            <p class="logout-desc">
              Tu turno activo quedará guardado.<br>
              Tendrás que volver a iniciar sesión para continuar.
            </p>

            <div class="logout-actions">
              <button class="logout-btn-cancel" (click)="cancelLogout()" [disabled]="isLoggingOut()">
                <mat-icon class="logout-btn-icon">close</mat-icon>
                Cancelar
              </button>
              <button class="logout-btn-confirm" (click)="logout()" [disabled]="isLoggingOut()">
                @if (isLoggingOut()) {
                  <mat-spinner diameter="16"></mat-spinner>
                  Saliendo...
                } @else {
                  <mat-icon class="logout-btn-icon">logout</mat-icon>
                  Confirmar
                }
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; width: 100vw; overflow: hidden; }
    .app-shell { display: flex; height: 100%; }

    /* ═══ RAIL (Desktop) ════════════════════════════════ */
    .rail {
      display: flex; flex-direction: column; flex-shrink: 0;
      width: 232px; transition: width .22s cubic-bezier(.4,0,.2,1);
      background: #0D0D14;
      border-right: 1px solid rgba(255,255,255,.05);
    }
    .rail--sm { width: 68px; }

    /* Brand */
    .rail-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 12px; min-height: 64px; flex-shrink: 0;
    }
    .rail-brand--sm { justify-content: center; padding: 16px 0; }

    .brand-mark {
      width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #4c1d95);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(124,58,237,.4);
    }
    .brand-text { overflow: hidden; }
    .brand-name { display: block; font-size: .95rem; font-weight: 900; color: #f8fafc; white-space: nowrap; letter-spacing: -.01em; }
    .brand-tag  { display: block; font-size: .6rem; font-weight: 600; text-transform: uppercase; letter-spacing: .15em; color: #3D3D4D; }

    .rail-sep { border-top: 1px solid rgba(255,255,255,.05); flex-shrink: 0; margin: 0 12px; }
    .rail-fill { flex: 1; }

    /* Nav */
    .rail-nav { display: flex; flex-direction: column; gap: 2px; padding: 8px; }
    .rail-nav--bottom { padding-bottom: 12px; }

    .nav-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 6px; border-radius: 12px; border: none; background: transparent;
      text-decoration: none; cursor: pointer; width: 100%;
      color: #475569; transition: color .15s; outline: none;
    }
    .nav-btn:hover { color: #e2e8f0; }
    .nav-btn:hover .nav-pill { background: rgba(255,255,255,.06); }

    .nav-pill {
      width: 52px; height: 32px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .nav-label { font-size: .85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-btn--on { color: #fff !important; }
    .nav-btn--on .nav-pill { background: rgba(99,102,241,.3) !important; box-shadow: 0 0 16px rgba(99,102,241,.15); }
    .nav-btn--ghost { color: #334155; }

    /* ═══ MAIN AREA ════════════════════════════════════ */
    .main { display: flex; flex-direction: column; flex: 1; min-width: 0; overflow: hidden; }

    /* ── Topbar ── */
    .topbar {
      display: flex; align-items: center; gap: 8px;
      height: 56px; padding: 0 16px 0 12px; flex-shrink: 0;
      background: #13131A;
      border-bottom: 1px solid #2D2D3D;
    }

    .toggle-btn {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: transparent; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: background .15s, color .15s;
    }
    .toggle-btn:hover { background: rgba(255,255,255,.06); color: #e2e8f0; }

    .topbar-title {
      font-size: .82rem; font-weight: 600;
      color: #475569; letter-spacing: .02em;
    }
    .topbar-spacer { flex: 1; }

    /* Live badge */
    .live-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 99px;
      background: rgba(16,185,129,.08);
      border: 1px solid rgba(16,185,129,.2);
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #10b981; box-shadow: 0 0 8px #10b981;
      animation: pulse-glow 2s infinite;
    }
    .live-label { font-size: .7rem; font-weight: 700; color: #10b981; letter-spacing: .04em; text-transform: uppercase; }

    @keyframes pulse-glow {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,.4); }
      70%  { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0);   }
    }

    /* User chip */
    .user-chip {
      display: flex; align-items: center; gap: 8px;
      margin-left: 8px; padding: 4px 10px 4px 4px;
      border-radius: 50px; background: #1C1C24; border: 1px solid #2D2D3D; cursor: default;
    }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(124,58,237,.25); border: 1px solid rgba(124,58,237,.3);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: #a78bfa;
    }
    .user-info { display: flex; flex-direction: column; line-height: 1.2; }
    .user-name { font-size: .76rem; font-weight: 700; color: #e2e8f0; }
    .user-role { font-size: .62rem; color: #475569; font-weight: 500; }

    /* Mobile brand */
    .mobile-brand {
      display: flex; align-items: center; gap: 8px;
    }
    .brand-mark-sm {
      width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #4c1d95);
      display: flex; align-items: center; justify-content: center;
    }
    .mobile-brand-name { font-size: .9rem; font-weight: 900; color: #f8fafc; letter-spacing: -.01em; }

    /* Logout mobile btn */
    .logout-mobile-btn {
      width: 36px; height: 36px; border-radius: 10px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; transition: background .15s, color .15s; margin-left: 4px;
    }
    .logout-mobile-btn:hover { background: rgba(255,255,255,.06); color: #f87171; }

    /* Desktop/mobile visibility helpers */
    .desktop-only { display: flex; }
    .mobile-only  { display: none; }

    /* Page area */
    .page-area { flex: 1; min-height: 0; overflow: auto; background: #13131A; }

    /* Scrollbar */
    .page-area::-webkit-scrollbar { width: 5px; }
    .page-area::-webkit-scrollbar-track { background: transparent; }
    .page-area::-webkit-scrollbar-thumb { background: #2D2D3D; border-radius: 4px; }

    /* ═══ BOTTOM NAV (Mobile) ═══════════════════════════ */
    .bottom-nav {
      display: none; /* Hidden on desktop */
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 800;
      height: 64px;
      background: #0D0D14;
      border-top: 1px solid rgba(255,255,255,.07);
      align-items: stretch;
      padding-bottom: env(safe-area-inset-bottom);
    }

    .bn-item {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 3px;
      text-decoration: none; color: #475569;
      transition: color .18s;
      position: relative;
    }
    .bn-item::before {
      content: '';
      position: absolute; top: 0; left: 20%; right: 20%;
      height: 2px; border-radius: 0 0 4px 4px;
      background: #6366f1; opacity: 0;
      transition: opacity .18s;
    }
    .bn-item:hover { color: #94a3b8; }
    .bn-item--on { color: #818cf8; }
    .bn-item--on::before { opacity: 1; }

    .bn-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; }
    .bn-label { font-size: .6rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; }

    /* ═══ RESPONSIVE (Mobile ≤ 767px) ══════════════════ */
    @media (max-width: 767px) {
      /* Hide desktop rail */
      .rail { display: none; }

      /* Show bottom nav */
      .bottom-nav { display: flex; }

      /* Page area padding for bottom nav */
      .page-area { padding-bottom: 64px; }

      /* Topbar adjustments */
      .topbar { height: 52px; padding: 0 12px; gap: 6px; }
      .topbar-title { display: none; }
      .desktop-only { display: none !important; }
      .mobile-only  { display: flex !important; }

      /* User chip compact */
      .user-info { display: none; }
      .user-chip { padding: 4px; border-radius: 50%; margin-left: 0; border: none; background: transparent; }
    }

    /* ═══ LOGOUT MODAL ══════════════════════════════════ */
    .logout-overlay {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.65);
      backdrop-filter: blur(6px);
      animation: overlay-in .2s ease;
    }
    @keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }

    .logout-modal {
      background: #1C1C24; border: 1px solid #2D2D3D; border-radius: 24px;
      box-shadow: 0 32px 80px rgba(0,0,0,.7);
      padding: 36px 28px 28px;
      width: 340px; max-width: 90vw;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      text-align: center;
      animation: modal-in .25s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes modal-in {
      from { opacity: 0; transform: scale(.88) translateY(16px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .logout-icon-wrap {
      position: relative; width: 68px; height: 68px;
      display: flex; align-items: center; justify-content: center;
    }
    .logout-icon-ring {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(239,68,68,.1); border: 1.5px solid rgba(239,68,68,.25);
      animation: ring-pulse 2s ease-in-out infinite;
    }
    @keyframes ring-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.08); opacity: .6; }
    }
    .logout-icon {
      position: relative; z-index: 1;
      font-size: 28px !important; width: 28px !important; height: 28px !important;
      color: #f87171; filter: drop-shadow(0 0 12px rgba(239,68,68,.4));
    }
    .logout-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: #f1f5f9; }
    .logout-desc  { margin: 0; font-size: .8rem; color: #64748b; line-height: 1.55; }
    .logout-actions { display: flex; gap: 10px; width: 100%; margin-top: 4px; }

    .logout-btn-cancel {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
      padding: 10px; border-radius: 12px;
      background: transparent; border: 1px solid #2D2D3D;
      color: #64748b; font-size: .82rem; font-weight: 600; cursor: pointer;
      transition: border-color .15s, color .15s;
    }
    .logout-btn-cancel:hover:not(:disabled) { border-color: #475569; color: #94a3b8; }
    .logout-btn-cancel:disabled { opacity: .4; cursor: not-allowed; }

    .logout-btn-confirm {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
      padding: 10px; border-radius: 12px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: white; font-size: .82rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(220,38,38,.3); transition: opacity .15s;
    }
    .logout-btn-confirm:hover:not(:disabled) { opacity: .9; }
    .logout-btn-confirm:disabled { opacity: .5; cursor: not-allowed; }
    .logout-btn-icon { font-size: 15px !important; width: 15px !important; height: 15px !important; }
  `]
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);

  sm               = signal(false);
  nav              = NAV;
  showLogoutModal  = signal(false);
  isLoggingOut     = signal(false);

  confirmLogout() { this.showLogoutModal.set(true); }
  cancelLogout()  { if (!this.isLoggingOut()) this.showLogoutModal.set(false); }

  async logout() {
    this.isLoggingOut.set(true);
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      this.isLoggingOut.set(false);
      this.showLogoutModal.set(false);
    }
  }
}
