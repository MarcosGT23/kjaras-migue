// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // <-- Importamos el guard

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // El Login es público, no lleva Guard
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) 
  },

  // ==========================================
  // RUTAS DEL CAJERO (Protegidas)
  // ==========================================
  {
    path: 'caja',
    canActivate: [authGuard], // <-- ¡CANDADO PUESTO!
    data: { rolEsperado: 'cajero' }, // <-- Exigimos que sea cajero
    loadComponent: () => import('./features/pos/layout/pos-layout.component').then(m => m.PosLayoutComponent),
    children: [
      { path: '', redirectTo: 'apertura', pathMatch: 'full' },
      { path: 'apertura', loadComponent: () => import('./features/pos/pages/apertura.component').then(m => m.AperturaComponent) },
      { path: 'venta', loadComponent: () => import('./features/pos/pages/venta-pos.component').then(m => m.VentaPosComponent) },
      { path: 'historial', loadComponent: () => import('./features/pos/pages/historial.component').then(m => m.HistorialComponent) },
      { path: 'cierre', loadComponent: () => import('./features/pos/pages/cierre.component').then(m => m.CierreComponent) }
    ]
  },

  // ==========================================
  // RUTAS DEL ADMINISTRADOR (Protegidas)
  // ==========================================
  {
    path: 'admin',
    canActivate: [authGuard], // <-- ¡CANDADO PUESTO!
    data: { rolEsperado: 'admin' }, // <-- Exigimos que sea administrador
    loadComponent: () => import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',  loadComponent: () => import('./features/admin/pages/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'inventario', loadComponent: () => import('./features/admin/pages/inventario.component').then(m => m.InventarioComponent) },
      { path: 'usuarios',   loadComponent: () => import('./features/admin/pages/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'ventas',     loadComponent: () => import('./features/admin/pages/ventas.component').then(m => m.VentasComponent) },
    ]
  },

  { path: '**', redirectTo: 'login' }
];