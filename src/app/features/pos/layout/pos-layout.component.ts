import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';

const NAV = [
  { path: '/caja/venta',    icon: 'point_of_sale', label: 'Caja Transaccional' },
  { path: '/caja/historial', icon: 'receipt_long',  label: 'Historial' },
];

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatDividerModule, MatRippleModule],
  template: `
    <div class="app-shell apple-font">

      <!-- ══ iPAD-STYLE SIDEBAR ══ -->
      <nav class="rail" [class.rail--sm]="sm()">

        <!-- Brand -->
        <div class="rail-brand" [class.rail-brand--sm]="sm()">
          <div class="brand-mark">
            <mat-icon class="!text-white !text-[20px]">restaurant</mat-icon>
          </div>
          @if (!sm()) {
            <div class="brand-text">
              <span class="brand-name">Kjaras</span>
              <span class="brand-tag">Terminal</span>
            </div>
          }
        </div>

        <div class="rail-sep"></div>

        <!-- Main nav -->
        <div class="rail-nav">
          <div class="nav-section-title" *ngIf="!sm()">OPERACIONES</div>
          @for (item of nav; track item.path) {
            <a class="nav-btn" 
               [routerLink]="item.path" routerLinkActive="nav-btn--on"
               [matTooltip]="sm() ? item.label : ''" matTooltipPosition="right">
              <div class="nav-pill">
                <mat-icon class="!text-[22px] font-light">{{ item.icon }}</mat-icon>
              </div>
              @if (!sm()) { <span class="nav-label">{{ item.label }}</span> }
            </a>
          }
        </div>

        <div class="rail-fill"></div>
        <div class="rail-sep"></div>

        <!-- Bottom nav (Admin/Sistema) -->
        <div class="rail-nav rail-nav--bottom">
          <div class="nav-section-title" *ngIf="!sm()">SISTEMA</div>
          
          <a class="nav-btn" style="color: #FF3B30;" 
             routerLink="/caja/cierre" routerLinkActive="nav-btn--on"
             [matTooltip]="sm() ? 'Cerrar Turno' : ''" matTooltipPosition="right">
            <div class="nav-pill" style="color: #FF3B30;"><mat-icon class="!text-[22px]">lock_outline</mat-icon></div>
            @if (!sm()) { <span class="nav-label" style="color: #FF3B30;">Cerrar Turno</span> }
          </a>

          <button class="nav-btn" (click)="logout()"
                  [matTooltip]="sm() ? 'Salir' : ''" matTooltipPosition="right">
            <div class="nav-pill"><mat-icon class="!text-[22px]">exit_to_app</mat-icon></div>
            @if (!sm()) { <span class="nav-label">Cerrar Sesión</span> }
          </button>
        </div>
      </nav>

      <!-- ══ MAIN CONTENT AREA ══ -->
      <div class="main">
        <!-- Top app bar (Glassmorphism) -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="toggle-btn" (click)="sm.set(!sm())">
              <mat-icon class="!text-[24px]" style="color: #8E8E93">{{ sm() ? 'menu' : 'menu_open' }}</mat-icon>
            </button>
            <span class="topbar-title">Módulo de Caja</span>
          </div>

          <div class="user-chip">
            <div class="user-info">
              <span class="user-name">{{ roleLabel() }}</span>
              <span class="user-status"><span class="dot"></span>Turno Activo</span>
            </div>
            <div class="user-avatar">
              <mat-icon class="!text-[20px]" style="color:#007AFF">person</mat-icon>
            </div>
          </div>
        </header>

        <main class="page-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ── Tipografía Estilo Apple (San Francisco fallback) ── */
    .apple-font {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :host { display: block; height: 100vh; width: 100vw; overflow: hidden; background: #FFFFFF; }

    .app-shell { display: flex; height: 100%; }

    /* ═══ iPAD SIDEBAR ═══ */
    .rail {
      display: flex; flex-direction: column; flex-shrink: 0;
      width: 250px; transition: width .25s cubic-bezier(0.25, 1, 0.5, 1);
      background: #F2F2F7; /* Apple iOS System Light Gray */
      border-right: 0.5px solid rgba(0,0,0,0.1);
      z-index: 50;
    }
    .rail--sm { width: 72px; }

    /* Brand */
    .rail-brand {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; min-height: 68px; flex-shrink: 0;
    }
    .rail-brand--sm { justify-content: center; padding: 16px 0; }

    .brand-mark {
      width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px; /* Squircle */
      background: #000000; /* Pure black for high contrast */
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .brand-text { overflow: hidden; display: flex; flex-direction: column; }
    .brand-name { font-size: 1.05rem; font-weight: 700; color: #000000; letter-spacing: -0.02em; line-height: 1.1; }
    .brand-tag  { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: #8E8E93; letter-spacing: 0.05em; margin-top: 2px;}

    .rail-sep { border-top: 0.5px solid rgba(0,0,0,0.06); flex-shrink: 0; margin: 0 20px; }
    .rail-fill { flex: 1; }

    /* Nav items */
    .rail-nav { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; }
    .rail-nav--bottom { padding-bottom: 24px; }
    
    .nav-section-title {
      font-size: 0.65rem; font-weight: 700; color: #8E8E93; 
      padding: 8px 12px 4px; text-transform: uppercase; letter-spacing: 0.04em;
    }

    .nav-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 12px; border: none; background: transparent;
      text-decoration: none; cursor: pointer; width: 100%;
      color: #1C1C1E; outline: none;
      transition: background 0.2s, transform 0.1s;
    }
    .nav-btn:active { transform: scale(0.97); } /* Apple active bounce */
    .nav-btn:hover { background: #E5E5EA; }

    .nav-pill {
      width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: #8E8E93; /* Apple unselected icon gray */
    }

    .nav-label { font-size: 0.95rem; font-weight: 500; white-space: nowrap; overflow: hidden; }

    /* Active Nav Item - iOS Style */
    .nav-btn--on { background: #007AFF !important; color: #FFFFFF !important; }
    .nav-btn--on .nav-pill { color: #FFFFFF !important; }
    .nav-btn--on .nav-label { font-weight: 600; }

    /* ═══ MAIN AREA ═══ */
    .main { display: flex; flex-direction: column; flex: 1; min-width: 0; overflow: hidden; background: #FFFFFF; }

    /* Topbar (Glassmorphism Blur) */
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      height: 60px; padding: 0 20px 0 10px; flex-shrink: 0;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 0.5px solid rgba(0,0,0,0.1);
      z-index: 10;
    }
    
    .topbar-left { display: flex; align-items: center; gap: 12px; }

    .toggle-btn {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      background: transparent; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .toggle-btn:hover { background: rgba(0,0,0,0.05); }

    .topbar-title {
      font-size: 1.1rem; font-weight: 600; color: #1C1C1E; letter-spacing: -0.01em;
    }

    /* Apple-style User Chip */
    .user-chip { display: flex; align-items: center; gap: 12px; }
    .user-info { display: flex; flex-direction: column; align-items: flex-end; }
    .user-name   { font-size: 0.85rem; font-weight: 600; color: #1C1C1E; line-height: 1.1;}
    .user-status { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #34C759; font-weight: 500; margin-top: 2px; }
    .dot { width: 5px; height: 5px; border-radius: 50%; background: #34C759; }
    
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #E5F0FF; /* iOS Light blue tint */
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    /* Page area */
    .page-area { flex: 1; min-height: 0; overflow: hidden; position: relative; background: #F2F2F7; }

    /* Media queries */
    @media (max-width: 640px) { 
      .topbar-title { display: none; } 
      .user-info { display: none; }
    }
  `]
})
export class PosLayoutComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);

  sm  = signal(false);
  nav = NAV;

  roleLabel() {
    const r = this.authService.userRole();
    const m: Record<string, string> = { cajero: 'Cajero', admin: 'Admin', parrillero: 'Parrillero', cocinero: 'Cocinero' };
    return r ? (m[r] ?? r) : 'Usuario';
  }
  async logout() { await this.authService.logout(); this.router.navigate(['/login']); }
}
