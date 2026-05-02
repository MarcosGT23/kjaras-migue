import {
  Component, inject, signal, computed,
  OnInit, OnDestroy
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../../core/supabase.service';

// ─── Interfaces ────────────────────────────────────────────────
interface Pedido {
  id: number;
  created_at: string;
  total: number;
  metodo_pago: string;
  estado: string;
  sucursal_id: number;
  sucursal_nombre: string;
  items: ItemPedido[];
  isNew?: boolean; // para animación live
}

interface ItemPedido {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface ResumenSucursal {
  id: number;
  nombre: string;
  activa: boolean;
  totalDia: number;
  cantidadVentas: number;
  ticketPromedio: number;
}

// ─── Demo data (fallback si Supabase no tiene datos) ───────────
const DEMO_PEDIDOS: Pedido[] = [
  { id: 3821, created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),  total: 56.40, metodo_pago: 'tarjeta',       estado: 'completado', sucursal_id: 1, sucursal_nombre: 'Sucursal Central', items: [{ nombre: 'Kjara Mixta', cantidad: 2, precio_unitario: 22.00 }, { nombre: 'Refresco', cantidad: 2, precio_unitario: 6.20 }] },
  { id: 3820, created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), total: 34.00, metodo_pago: 'efectivo',      estado: 'completado', sucursal_id: 2, sucursal_nombre: 'Sucursal Norte',   items: [{ nombre: 'Kjara Especial', cantidad: 1, precio_unitario: 28.00 }, { nombre: 'Agua', cantidad: 2, precio_unitario: 3.00 }] },
  { id: 3819, created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), total: 18.90, metodo_pago: 'qr',            estado: 'completado', sucursal_id: 1, sucursal_nombre: 'Sucursal Central', items: [{ nombre: 'Kjara Simple', cantidad: 1, precio_unitario: 18.90 }] },
  { id: 3818, created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString(), total: 72.00, metodo_pago: 'transferencia', estado: 'completado', sucursal_id: 3, sucursal_nombre: 'Sucursal Sur',     items: [{ nombre: 'Kjara Mixta', cantidad: 3, precio_unitario: 22.00 }, { nombre: 'Refresco', cantidad: 3, precio_unitario: 2.00 }] },
  { id: 3817, created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(), total: 45.00, metodo_pago: 'efectivo',      estado: 'completado', sucursal_id: 2, sucursal_nombre: 'Sucursal Norte',   items: [{ nombre: 'Kjara Especial', cantidad: 2, precio_unitario: 28.00 }] },
  { id: 3816, created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString(), total: 22.00, metodo_pago: 'qr',            estado: 'completado', sucursal_id: 1, sucursal_nombre: 'Sucursal Central', items: [{ nombre: 'Kjara Mixta', cantidad: 1, precio_unitario: 22.00 }] },
  { id: 3815, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), total: 30.00, metodo_pago: 'tarjeta',       estado: 'completado', sucursal_id: 3, sucursal_nombre: 'Sucursal Sur',     items: [{ nombre: 'Combo Familiar', cantidad: 1, precio_unitario: 30.00 }] },
  { id: 3814, created_at: new Date(Date.now() - 1000 * 60 * 115).toISOString(),total: 15.99, metodo_pago: 'transferencia', estado: 'completado', sucursal_id: 2, sucursal_nombre: 'Sucursal Norte',   items: [{ nombre: 'Kjara Simple', cantidad: 1, precio_unitario: 12.00 }, { nombre: 'Jugo', cantidad: 1, precio_unitario: 3.99 }] },
];

const DEMO_SUCURSALES: ResumenSucursal[] = [
  { id: 1, nombre: 'Sucursal Central', activa: true,  totalDia: 0, cantidadVentas: 0, ticketPromedio: 0 },
  { id: 2, nombre: 'Sucursal Norte',   activa: true,  totalDia: 0, cantidadVentas: 0, ticketPromedio: 0 },
  { id: 3, nombre: 'Sucursal Sur',     activa: false, totalDia: 0, cantidadVentas: 0, ticketPromedio: 0 },
];

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, DecimalPipe, DatePipe],
  template: `
<div class="p-4 md:p-8 bg-[#13131A] min-h-screen text-slate-200 font-sans tracking-wide">
<div class="max-w-[1400px] mx-auto flex flex-col gap-6">

  <!-- ── HEADER ── -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
        <mat-icon class="text-emerald-400 scale-75">point_of_sale</mat-icon>
      </div>
      <div>
        <h1 class="text-xl font-semibold text-white m-0 tracking-tight">Centro de Ventas</h1>
        <p class="text-xs text-slate-500 m-0 mt-0.5">Monitoreo en tiempo real y análisis por sucursal</p>
      </div>
    </div>

    <!-- Filtro de fecha (Historial) -->
    @if (tabActivo() === 'historial') {
      <div class="dark-tabs">
        @for (f of filtros; track f.valor) {
          <button class="tab-btn" [class.tab-btn--on]="filtroActivo() === f.valor" (click)="filtroActivo.set(f.valor)">
            {{ f.label }}
          </button>
        }
      </div>
    }
  </div>

  <!-- ── TABS ── -->
  <div class="dark-tabs ventas-tabs">
    <button class="tab-btn tab-btn--icon" [class.tab-btn--on]="tabActivo() === 'live'" (click)="tabActivo.set('live')">
      <span class="live-dot-sm" [class.opacity-100]="tabActivo() === 'live'" [class.opacity-40]="tabActivo() !== 'live'"></span>
      En Vivo
    </button>
    <button class="tab-btn tab-btn--icon" [class.tab-btn--on]="tabActivo() === 'sucursales'" (click)="tabActivo.set('sucursales')">
      <mat-icon class="scale-75">store</mat-icon>
      Sucursales
    </button>
    <button class="tab-btn tab-btn--icon" [class.tab-btn--on]="tabActivo() === 'historial'" (click)="tabActivo.set('historial')">
      <mat-icon class="scale-75">history</mat-icon>
      Historial
    </button>
  </div>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- TAB: EN VIVO -->
  <!-- ══════════════════════════════════════════════════════ -->
  @if (tabActivo() === 'live') {
    <div class="flex flex-col gap-6">

      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="dark-card p-5 relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-28 h-28 bg-emerald-500/8 rounded-full blur-2xl"></div>
          <span class="text-xs text-slate-500 font-medium">Total Hoy</span>
          <div class="text-3xl font-light text-white mt-1">Bs. {{ kpis().totalHoy | number:'1.2-2' }}</div>
          <span class="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <mat-icon class="scale-50 -ml-1">trending_up</mat-icon> Actualización en tiempo real
          </span>
        </div>
        <div class="dark-card p-5 relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-28 h-28 bg-indigo-500/8 rounded-full blur-2xl"></div>
          <span class="text-xs text-slate-500 font-medium">Transacciones Hoy</span>
          <div class="text-3xl font-light text-white mt-1">{{ kpis().totalVentas }}</div>
          <div class="text-xs text-indigo-400 flex items-center gap-1 mt-2">
            <mat-icon class="scale-[0.5] -ml-1">fiber_manual_record</mat-icon> En vivo
          </div>
        </div>
        <div class="dark-card p-5 relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-28 h-28 bg-violet-500/8 rounded-full blur-2xl"></div>
          <span class="text-xs text-slate-500 font-medium">Ticket Promedio</span>
          <div class="text-3xl font-light text-white mt-1">Bs. {{ kpis().ticketPromedio | number:'1.2-2' }}</div>
          <span class="text-xs text-slate-500 mt-2 block">Por transacción</span>
        </div>
      </div>

      <!-- Feed en vivo -->
      <div class="dark-card overflow-hidden">
        <div class="p-4 border-b border-[#2D2D3D] flex items-center justify-between">
          <h2 class="text-sm font-semibold text-white flex items-center gap-2 m-0">
            Transacciones en Tiempo Real
            <span class="live-badge">
              <span class="live-dot"></span> LIVE
            </span>
          </h2>
          <span class="text-xs text-slate-500">{{ pedidosLive().length }} ventas registradas hoy</span>
        </div>

        <div class="overflow-y-auto max-h-[520px] divide-y divide-[#2D2D3D]/50">
          @for (p of pedidosLive(); track p.id) {
            <div class="flex items-center gap-4 px-5 py-4 hover:bg-[#1A1A24] transition-colors cursor-pointer group"
                 [class.sale-new]="p.isNew"
                 (click)="abrirDetalle(p)">

              <!-- Método icono -->
              <div class="method-icon" [class]="'method-' + p.metodo_pago">
                <mat-icon class="scale-75">{{ getMetodoIcon(p.metodo_pago) }}</mat-icon>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-white">#{{ p.id }}</span>
                  <span class="text-xs text-slate-500">{{ p.sucursal_nombre }}</span>
                  @if (p.isNew) { <span class="new-badge">NUEVA</span> }
                </div>
                <div class="text-xs text-slate-500 mt-0.5">{{ p.created_at | date:'HH:mm:ss' }} · {{ p.items.length }} item(s)</div>
              </div>

              <div class="text-right">
                <div class="text-white font-bold">Bs. {{ p.total | number:'1.2-2' }}</div>
                <div class="text-[10px] font-semibold uppercase tracking-wider mt-0.5" [class]="getMetodoColor(p.metodo_pago)">
                  {{ p.metodo_pago }}
                </div>
              </div>

              <mat-icon class="text-slate-700 group-hover:text-indigo-400 scale-75 transition-colors">chevron_right</mat-icon>
            </div>
          }

          @if (pedidosLive().length === 0 && !cargando()) {
            <div class="py-20 text-center">
              <mat-icon class="text-slate-700 text-5xl mb-3 block">receipt_long</mat-icon>
              <p class="text-slate-500 text-sm">Esperando transacciones...</p>
              <p class="text-slate-600 text-xs mt-1">El feed se actualizará automáticamente</p>
            </div>
          }

          @if (cargando()) {
            <div class="py-16 flex justify-center">
              <mat-spinner diameter="32"></mat-spinner>
            </div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- TAB: POR SUCURSAL -->
  <!-- ══════════════════════════════════════════════════════ -->
  @if (tabActivo() === 'sucursales') {
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      @for (s of resumenSucursales(); track s.id) {
        <div class="sucursal-card group cursor-pointer" (click)="abrirDrawerSucursal(s)">

          <!-- Card header -->
          <div class="p-5 border-b border-[#2D2D3D] flex items-start gap-4">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                 [class]="s.activa ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-[#1A1A24] border border-[#2D2D3D]'">
              <mat-icon [class]="s.activa ? 'text-emerald-400 scale-90' : 'text-slate-600 scale-90'">storefront</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-semibold text-base m-0 truncate">{{ s.nombre }}</h3>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="relative flex h-2 w-2">
                  @if (s.activa) { <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span> }
                  <span class="relative inline-flex rounded-full h-2 w-2" [class]="s.activa ? 'bg-emerald-500' : 'bg-slate-600'"></span>
                </span>
                <span class="text-xs font-semibold" [class]="s.activa ? 'text-emerald-400' : 'text-slate-500'">
                  {{ s.activa ? 'Operativa' : 'Cerrada' }}
                </span>
              </div>
            </div>
            <mat-icon class="text-slate-700 group-hover:text-indigo-400 transition-colors">arrow_forward_ios</mat-icon>
          </div>

          <!-- Métricas -->
          <div class="p-5 grid grid-cols-3 gap-3">
            <div class="text-center">
              <div class="text-lg font-bold text-white">{{ s.cantidadVentas }}</div>
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Ventas</div>
            </div>
            <div class="text-center border-x border-[#2D2D3D]">
              <div class="text-lg font-bold text-white">{{ s.totalDia | number:'1.0-0' }}</div>
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Bs. Total</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-white">{{ s.ticketPromedio | number:'1.0-0' }}</div>
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Bs. Prom.</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t border-[#2D2D3D] bg-[#13131A]/50 flex items-center justify-between rounded-b-2xl">
            <span class="text-xs text-slate-600">Ver historial completo</span>
            <mat-icon class="text-slate-600 group-hover:text-indigo-400 scale-75 transition-colors">chevron_right</mat-icon>
          </div>
        </div>
      }
    </div>
  }

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- TAB: HISTORIAL GENERAL -->
  <!-- ══════════════════════════════════════════════════════ -->
  @if (tabActivo() === 'historial') {
    <div class="dark-card overflow-hidden">

      <!-- Search bar -->
      <div class="p-4 border-b border-[#2D2D3D] flex items-center gap-3">
        <mat-icon class="text-slate-500">search</mat-icon>
        <input #buscar class="bg-transparent outline-none border-none text-slate-300 placeholder-slate-600 text-sm w-full"
               placeholder="Buscar por ID, sucursal o método…"
               (keyup)="busqueda.set(buscar.value)" />
        @if (buscar.value) {
          <button class="text-slate-500 hover:text-slate-300 transition-colors" (click)="buscar.value = ''; busqueda.set('');">
            <mat-icon class="scale-75">close</mat-icon>
          </button>
        }
      </div>

      <!-- ── VISTA DESKTOP: Tabla completa ── -->
      <div class="hist-desktop">
        <table class="ventas-table text-left border-collapse">
          <thead>
            <tr class="text-[10px] text-slate-500 uppercase tracking-widest border-b border-[#2D2D3D] bg-[#13131A]">
              <th class="px-4 py-3 font-bold">Ticket</th>
              <th class="px-4 py-3 font-bold">Hora</th>
              <th class="px-4 py-3 font-bold">Sucursal</th>
              <th class="px-4 py-3 font-bold">Método</th>
              <th class="px-4 py-3 font-bold text-center">Items</th>
              <th class="px-4 py-3 font-bold text-right">Total</th>
              <th class="px-4 py-3 font-bold text-center">Estado</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (p of pedidosFiltrados(); track p.id) {
              <tr class="border-b border-[#2D2D3D]/40 hover:bg-[#1A1A24] transition-colors cursor-pointer group"
                  (click)="abrirDetalle(p)">
                <td class="px-4 py-4 text-slate-300 font-semibold">#{{ p.id }}</td>
                <td class="px-4 py-4 text-slate-500 text-sm">{{ p.created_at | date:'HH:mm' }}</td>
                <td class="px-4 py-4 text-slate-300 text-sm">{{ p.sucursal_nombre }}</td>
                <td class="px-4 py-4">
                  <span class="metodo-chip" [class]="'metodo-' + p.metodo_pago">
                    <mat-icon class="scale-[0.55] -ml-1">{{ getMetodoIcon(p.metodo_pago) }}</mat-icon>
                    {{ p.metodo_pago | uppercase }}
                  </span>
                </td>
                <td class="px-4 py-4 text-center text-slate-400 text-sm">{{ p.items.length }}</td>
                <td class="px-4 py-4 text-right font-bold text-white">Bs. {{ p.total | number:'1.2-2' }}</td>
                <td class="px-4 py-4 text-center">
                  <span class="estado-badge">{{ p.estado }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <mat-icon class="text-slate-700 group-hover:text-indigo-400 scale-75 transition-colors">more_vert</mat-icon>
                </td>
              </tr>
            }
            @if (pedidosFiltrados().length === 0) {
              <tr>
                <td colspan="8" class="py-16 text-center text-slate-600">
                  <mat-icon class="text-4xl opacity-30 block mx-auto mb-2">search_off</mat-icon>
                  <p class="text-sm">Sin resultados</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- ── VISTA MÓVIL: Tarjetas apiladas ── -->
      <div class="hist-mobile divide-y divide-[#2D2D3D]/50">
        @for (p of pedidosFiltrados(); track p.id) {
          <div class="hist-card group" (click)="abrirDetalle(p)">

            <!-- Fila superior: ticket + hora + total -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">#{{ p.id }}</span>
                <span class="text-xs text-slate-600">{{ p.created_at | date:'HH:mm' }}</span>
              </div>
              <span class="text-base font-bold text-white">Bs. {{ p.total | number:'1.2-2' }}</span>
            </div>

            <!-- Fila media: sucursal -->
            <div class="flex items-center gap-1.5 mb-3">
              <mat-icon class="text-slate-600 scale-[0.65] -ml-1">store</mat-icon>
              <span class="text-xs text-slate-400">{{ p.sucursal_nombre }}</span>
            </div>

            <!-- Fila inferior: método + estado + items + chevron -->
            <div class="flex items-center gap-2">
              <span class="metodo-chip" [class]="'metodo-' + p.metodo_pago">
                <mat-icon class="scale-[0.55] -ml-1">{{ getMetodoIcon(p.metodo_pago) }}</mat-icon>
                {{ p.metodo_pago | uppercase }}
              </span>
              <span class="estado-badge">{{ p.estado }}</span>
              <span class="ml-auto text-xs text-slate-600">{{ p.items.length }} item(s)</span>
              <mat-icon class="text-slate-700 group-hover:text-indigo-400 scale-[0.7] transition-colors flex-shrink-0">chevron_right</mat-icon>
            </div>

          </div>
        }

        @if (pedidosFiltrados().length === 0) {
          <div class="py-14 text-center text-slate-600">
            <mat-icon class="text-4xl opacity-30 block mx-auto mb-2">search_off</mat-icon>
            <p class="text-sm">Sin resultados</p>
          </div>
        }
      </div>

      <!-- Footer conteo -->
      <div class="px-5 py-3 border-t border-[#2D2D3D] flex items-center justify-between">
        <span class="text-xs text-slate-600">{{ pedidosFiltrados().length }} registros</span>
        <span class="text-xs text-slate-600">{{ filtroActivo() === 'hoy' ? 'Hoy' : filtroActivo() === 'semana' ? 'Esta semana' : 'Este mes' }}</span>
      </div>
    </div>
  }

</div>
</div>

<!-- ════════════════════════════════════════════════════════════ -->
<!-- DRAWER — HISTORIAL DE SUCURSAL                              -->
<!-- ════════════════════════════════════════════════════════════ -->
@if (drawerSucursal()) {
  <div class="drawer-overlay" (click)="cerrarDrawer()">
    <div class="drawer-panel" (click)="$event.stopPropagation()">

      <!-- Drawer header -->
      <div class="drawer-header">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               [class]="drawerSucursal()!.activa ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-[#1A1A24] border border-[#2D2D3D]'">
            <mat-icon [class]="drawerSucursal()!.activa ? 'text-emerald-400' : 'text-slate-600'">storefront</mat-icon>
          </div>
          <div class="min-w-0">
            <h2 class="text-base font-bold text-white m-0 truncate">{{ drawerSucursal()!.nombre }}</h2>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="relative flex h-1.5 w-1.5">
                @if (drawerSucursal()!.activa) { <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span> }
                <span class="relative inline-flex rounded-full h-1.5 w-1.5" [class]="drawerSucursal()!.activa ? 'bg-emerald-500' : 'bg-slate-600'"></span>
              </span>
              <span class="text-xs" [class]="drawerSucursal()!.activa ? 'text-emerald-400' : 'text-slate-500'">
                {{ drawerSucursal()!.activa ? 'Operativa' : 'Cerrada' }}
              </span>
            </div>
          </div>
        </div>
        <button class="drawer-close-btn" (click)="cerrarDrawer()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- KPIs de la sucursal -->
      <div class="grid grid-cols-3 gap-3 p-4 border-b border-[#2D2D3D]">
        <div class="drawer-kpi">
          <div class="drawer-kpi-value">{{ drawerSucursal()!.cantidadVentas }}</div>
          <div class="drawer-kpi-label">Ventas hoy</div>
        </div>
        <div class="drawer-kpi border-x border-[#2D2D3D]">
          <div class="drawer-kpi-value">Bs. {{ drawerSucursal()!.totalDia | number:'1.0-0' }}</div>
          <div class="drawer-kpi-label">Total</div>
        </div>
        <div class="drawer-kpi">
          <div class="drawer-kpi-value">Bs. {{ drawerSucursal()!.ticketPromedio | number:'1.0-0' }}</div>
          <div class="drawer-kpi-label">Promedio</div>
        </div>
      </div>

      <!-- Lista de pedidos de la sucursal -->
      <div class="flex-1 overflow-y-auto divide-y divide-[#2D2D3D]/50">
        @if (cargandoDrawer()) {
          <div class="py-12 flex justify-center"><mat-spinner diameter="28"></mat-spinner></div>
        }
        @for (p of pedidosDrawer(); track p.id) {
          <div class="flex items-center gap-3 px-4 py-3.5 hover:bg-[#1A1A24] transition-colors cursor-pointer group"
               (click)="abrirDetalle(p)">
            <div class="method-icon-sm" [class]="'method-' + p.metodo_pago">
              <mat-icon class="scale-[0.6]">{{ getMetodoIcon(p.metodo_pago) }}</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-white">#{{ p.id }}</div>
              <div class="text-xs text-slate-500 mt-0.5">{{ p.created_at | date:'HH:mm' }} · {{ p.items.length }} items</div>
            </div>
            <div class="text-right">
              <div class="text-white font-bold text-sm">Bs. {{ p.total | number:'1.2-2' }}</div>
              <div class="text-[10px] font-semibold mt-0.5 uppercase" [class]="getMetodoColor(p.metodo_pago)">{{ p.metodo_pago }}</div>
            </div>
            <mat-icon class="text-slate-700 group-hover:text-indigo-400 scale-75 transition-colors">chevron_right</mat-icon>
          </div>
        }
        @if (!cargandoDrawer() && pedidosDrawer().length === 0) {
          <div class="py-16 text-center text-slate-600">
            <mat-icon class="text-4xl opacity-30 block mx-auto mb-2">receipt_long</mat-icon>
            <p class="text-sm">Sin ventas registradas hoy</p>
          </div>
        }
      </div>
    </div>
  </div>
}

<!-- ════════════════════════════════════════════════════════════ -->
<!-- MODAL — DETALLE DEL PEDIDO                                  -->
<!-- ════════════════════════════════════════════════════════════ -->
@if (pedidoDetalle()) {
  <div class="modal-overlay" (click)="cerrarDetalle()">
    <div class="modal-dark" (click)="$event.stopPropagation()">

      <!-- Modal header -->
      <div class="modal-header">
        <div class="flex items-center gap-3">
          <div class="ticket-badge">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-white m-0">Ticket #{{ pedidoDetalle()!.id }}</h3>
            <p class="text-xs text-slate-500 m-0 mt-0.5">
              {{ pedidoDetalle()!.created_at | date:'HH:mm:ss' }} · {{ pedidoDetalle()!.sucursal_nombre }}
            </p>
          </div>
        </div>
        <button class="close-btn" (click)="cerrarDetalle()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Info chips -->
      <div class="flex gap-3 px-6 py-4 border-b border-[#2D2D3D]">
        <div class="metodo-chip" [class]="'metodo-' + pedidoDetalle()!.metodo_pago">
          <mat-icon class="scale-[0.6] -ml-1">{{ getMetodoIcon(pedidoDetalle()!.metodo_pago) }}</mat-icon>
          {{ pedidoDetalle()!.metodo_pago | uppercase }}
        </div>
        <div class="estado-badge-modal">
          <mat-icon class="scale-[0.6] -ml-1">check_circle</mat-icon>
          {{ pedidoDetalle()!.estado | uppercase }}
        </div>
      </div>

      <!-- Items del pedido -->
      <div class="px-6 py-4 flex flex-col gap-2 max-h-[280px] overflow-y-auto">
        <div class="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-1">Productos</div>
        @for (item of pedidoDetalle()!.items; track $index) {
          <div class="flex items-center justify-between py-2 border-b border-[#2D2D3D]/40">
            <div class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-lg bg-[#1A1A24] border border-[#2D2D3D] flex items-center justify-center flex-shrink-0">
                <mat-icon class="scale-[0.5] text-amber-400">restaurant</mat-icon>
              </div>
              <span class="text-sm text-slate-200 font-medium">{{ item.nombre }}</span>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500">{{ item.cantidad }}x — Bs. {{ item.precio_unitario | number:'1.2-2' }}</div>
              <div class="text-sm font-bold text-white">Bs. {{ (item.cantidad * item.precio_unitario) | number:'1.2-2' }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Total -->
      <div class="mx-6 mb-4 bg-[#13131A] border border-[#2D2D3D] rounded-xl p-4 flex flex-col gap-2">
        <div class="flex justify-between text-sm text-slate-400">
          <span>Subtotal</span>
          <span>Bs. {{ pedidoDetalle()!.total | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-sm text-slate-400">
          <span>Descuento</span>
          <span class="text-emerald-400">- Bs. 0.00</span>
        </div>
        <div class="border-t border-[#2D2D3D] pt-2 flex justify-between">
          <span class="font-bold text-white">Total</span>
          <span class="text-lg font-bold text-indigo-400">Bs. {{ pedidoDetalle()!.total | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-ghost" (click)="cerrarDetalle()">
          <mat-icon class="btn-icon">close</mat-icon> Cerrar
        </button>
        <button class="btn-primary">
          <mat-icon class="btn-icon">print</mat-icon> Reimprimir
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    /* ── Dark card base ────────────────────────────────── */
    .dark-card {
      background: #1C1C24; border: 1px solid #2D2D3D;
      border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.25);
    }

    /* ── Tabs ──────────────────────────────────────────── */
    .dark-tabs {
      display: flex; gap: 4px;
      background: #1C1C24; border: 1px solid #2D2D3D;
      border-radius: 14px; padding: 4px; width: fit-content;
    }
    .tab-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 16px; border-radius: 10px; border: none; cursor: pointer;
      background: transparent; color: #64748b;
      font-size: .82rem; font-weight: 600; transition: all .18s;
    }
    .tab-btn:hover { color: #e2e8f0; }
    .tab-btn--on { background: #2D2D3D; color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
    .tab-btn--icon { display: inline-flex; align-items: center; gap: 5px; }

    /* ── Live indicators ───────────────────────────────── */
    .live-dot-sm {
      width: 7px; height: 7px; border-radius: 50%;
      background: #10b981; box-shadow: 0 0 8px #10b981;
      animation: pulse-glow 2s infinite;
    }
    .live-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 99px;
      background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2);
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #10b981; box-shadow: 0 0 6px #10b981;
      animation: pulse-glow 2s infinite;
    }
    .live-badge { font-size: .7rem; font-weight: 700; color: #10b981; letter-spacing: .06em; }
    @keyframes pulse-glow {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,.5); }
      70%  { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0);   }
    }

    /* ── New sale animation ────────────────────────────── */
    .sale-new { animation: slide-in-top .4s cubic-bezier(.34,1.36,.64,1); }
    @keyframes slide-in-top {
      from { opacity: 0; transform: translateY(-16px); background: rgba(99,102,241,.08); }
      to   { opacity: 1; transform: translateY(0);     background: transparent; }
    }
    .new-badge {
      font-size: .65rem; font-weight: 800; color: #818cf8;
      background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.25);
      padding: 1px 7px; border-radius: 99px; letter-spacing: .06em;
      animation: badge-flash 1.5s ease;
    }
    @keyframes badge-flash {
      0%, 100% { opacity: 1; }
      50%       { opacity: .4; }
    }

    /* ── Method icons ──────────────────────────────────── */
    .method-icon {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .method-icon-sm {
      width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .method-efectivo       { background: rgba(245,158,11,.12); color: #fbbf24; border: 1px solid rgba(245,158,11,.2); }
    .method-qr             { background: rgba(99,102,241,.12);  color: #818cf8; border: 1px solid rgba(99,102,241,.2);  }
    .method-tarjeta        { background: rgba(139,92,246,.12);  color: #a78bfa; border: 1px solid rgba(139,92,246,.2);  }
    .method-transferencia  { background: rgba(16,185,129,.12);  color: #34d399; border: 1px solid rgba(16,185,129,.2);  }

    /* ── Metodo chip (table) ───────────────────────────── */
    .metodo-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 8px;
      font-size: .7rem; font-weight: 700; letter-spacing: .04em;
    }
    .metodo-efectivo      { background: rgba(245,158,11,.12); color: #fbbf24; border: 1px solid rgba(245,158,11,.2); }
    .metodo-qr            { background: rgba(99,102,241,.12);  color: #818cf8; border: 1px solid rgba(99,102,241,.2);  }
    .metodo-tarjeta       { background: rgba(139,92,246,.12);  color: #a78bfa; border: 1px solid rgba(139,92,246,.2);  }
    .metodo-transferencia { background: rgba(16,185,129,.12);  color: #34d399; border: 1px solid rgba(16,185,129,.2);  }

    /* ── Estado badge ──────────────────────────────────── */
    .estado-badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 8px;
      font-size: .68rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
      background: rgba(16,185,129,.1); color: #34d399; border: 1px solid rgba(16,185,129,.2);
    }
    .estado-badge-modal {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 4px 12px; border-radius: 8px;
      font-size: .75rem; font-weight: 700; letter-spacing: .04em;
      background: rgba(16,185,129,.1); color: #34d399; border: 1px solid rgba(16,185,129,.2);
    }

    /* ── Sucursal card ─────────────────────────────────── */
    .sucursal-card {
      background: #1C1C24; border: 1px solid #2D2D3D; border-radius: 20px;
      overflow: hidden; transition: border-color .2s, box-shadow .2s, transform .2s;
    }
    .sucursal-card:hover {
      border-color: rgba(99,102,241,.3);
      box-shadow: 0 0 0 1px rgba(99,102,241,.08), 0 12px 40px rgba(0,0,0,.35);
      transform: translateY(-2px);
    }

    /* ── DRAWER ────────────────────────────────────────── */
    .drawer-overlay {
      position: fixed; inset: 0; z-index: 900;
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(4px);
      display: flex; justify-content: flex-end;
      animation: overlay-fade-in .2s ease;
    }
    @keyframes overlay-fade-in {
      from { opacity: 0; } to { opacity: 1; }
    }

    .drawer-panel {
      width: 420px; max-width: 95vw; height: 100%;
      background: #1C1C24; border-left: 1px solid #2D2D3D;
      display: flex; flex-direction: column;
      box-shadow: -16px 0 48px rgba(0,0,0,.5);
      animation: drawer-slide-in .28s cubic-bezier(.4,0,.2,1);
    }
    @keyframes drawer-slide-in {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .drawer-header {
      display: flex; align-items: center; gap: 12px;
      padding: 18px 20px;
      background: #13131A;
      border-bottom: 1px solid #2D2D3D;
      flex-shrink: 0;
    }
    .drawer-close-btn {
      width: 34px; height: 34px; border-radius: 10px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; transition: background .15s, color .15s;
    }
    .drawer-close-btn:hover { background: rgba(255,255,255,.06); color: #e2e8f0; }

    .drawer-kpi { text-align: center; padding: 8px 4px; }
    .drawer-kpi-value { font-size: .95rem; font-weight: 700; color: #e2e8f0; }
    .drawer-kpi-label { font-size: .65rem; text-transform: uppercase; letter-spacing: .08em; color: #475569; margin-top: 2px; }

    /* ── MODAL OVERLAY ─────────────────────────────────── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.7);
      backdrop-filter: blur(6px);
      animation: overlay-fade-in .2s ease;
    }

    .modal-dark {
      background: #1C1C24; border: 1px solid #2D2D3D;
      border-radius: 20px; width: 500px; max-width: 95vw;
      max-height: 90vh; overflow: hidden;
      display: flex; flex-direction: column;
      box-shadow: 0 32px 80px rgba(0,0,0,.7);
      animation: modal-spring-in .28s cubic-bezier(.34,1.46,.64,1);
    }
    @keyframes modal-spring-in {
      from { opacity: 0; transform: scale(.88) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 24px;
      background: #13131A; border-bottom: 1px solid #2D2D3D;
      flex-shrink: 0;
    }
    .ticket-badge {
      width: 44px; height: 44px; border-radius: 13px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      color: white; box-shadow: 0 4px 14px rgba(79,70,229,.35);
      flex-shrink: 0;
    }
    .close-btn {
      width: 34px; height: 34px; border-radius: 10px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; transition: background .15s, color .15s;
    }
    .close-btn:hover { background: rgba(255,255,255,.06); color: #e2e8f0; }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 14px 24px;
      background: #13131A; border-top: 1px solid #2D2D3D;
      flex-shrink: 0;
    }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 8px 18px; border-radius: 10px;
      background: transparent; border: 1px solid #2D2D3D;
      color: #64748b; font-size: .82rem; font-weight: 600; cursor: pointer;
      transition: border-color .15s, color .15s;
    }
    .btn-ghost:hover { border-color: #475569; color: #94a3b8; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 8px 18px; border-radius: 10px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: .82rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(99,102,241,.25); transition: opacity .15s;
    }
    .btn-primary:hover { opacity: .9; }
    .btn-icon { font-size: 15px !important; width: 15px !important; height: 15px !important; }

    /* ── Scrollbar dark ────────────────────────────────── */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #2D2D3D; border-radius: 4px; }

    /* ══ Historial dual-view ════════════════════════════ */

    /* Desktop: tabla visible, tarjetas ocultas */
    .hist-desktop { display: block; overflow-x: auto; }
    .hist-mobile  { display: none; }

    .ventas-table { width: 100%; min-width: 640px; border-collapse: collapse; }

    /* Mobile cards */
    .hist-card {
      padding: 14px 16px;
      cursor: pointer;
      transition: background .15s;
    }
    .hist-card:hover { background: rgba(26,26,36,.7); }
    .hist-card:active { background: rgba(26,26,36,.9); }

    /* En móvil: ocultar tabla, mostrar tarjetas */
    @media (max-width: 767px) {
      .hist-desktop { display: none; }
      .hist-mobile  { display: block; }
    }

    /* ── RESPONSIVE MOBILE extra ────────────────────── */
    .ventas-tabs { width: 100%; }
    .ventas-tabs .tab-btn { flex: 1; justify-content: center; }

    @media (max-width: 767px) {
      .drawer-panel { width: 100vw; max-width: 100vw; }
    }
  `]
})
export class VentasComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);

  // ── State ──────────────────────────────────────────────────────
  tabActivo     = signal<'live' | 'sucursales' | 'historial'>('live');
  filtroActivo  = signal<'hoy' | 'semana' | 'mes'>('hoy');
  busqueda      = signal('');
  cargando      = signal(true);
  cargandoDrawer = signal(false);

  pedidosTodos    = signal<Pedido[]>([]);
  pedidosLive     = signal<Pedido[]>([]);
  resumenSucursales = signal<ResumenSucursal[]>([]);

  drawerSucursal  = signal<ResumenSucursal | null>(null);
  pedidosDrawer   = signal<Pedido[]>([]);
  pedidoDetalle   = signal<Pedido | null>(null);

  private canal: any;

  filtros = [
    { valor: 'hoy',    label: 'Hoy'        },
    { valor: 'semana', label: 'Esta semana' },
    { valor: 'mes',    label: 'Este mes'   },
  ];

  // ── Computed ───────────────────────────────────────────────────
  kpis = computed(() => {
    const todos = this.pedidosLive();
    const total = todos.reduce((s, p) => s + p.total, 0);
    const cant  = todos.length;
    return {
      totalHoy:      total,
      totalVentas:   cant,
      ticketPromedio: cant > 0 ? total / cant : 0
    };
  });

  pedidosFiltrados = computed(() => {
    const ahora   = new Date();
    const busq    = this.busqueda().toLowerCase();
    let desde: Date;

    if (this.filtroActivo() === 'hoy') {
      desde = new Date(ahora); desde.setHours(0,0,0,0);
    } else if (this.filtroActivo() === 'semana') {
      desde = new Date(ahora); desde.setDate(ahora.getDate() - 7);
    } else {
      desde = new Date(ahora); desde.setDate(1); desde.setHours(0,0,0,0);
    }

    return this.pedidosTodos().filter(p => {
      const enRango = new Date(p.created_at) >= desde;
      if (!enRango) return false;
      if (!busq) return true;
      return (
        String(p.id).includes(busq) ||
        p.sucursal_nombre.toLowerCase().includes(busq) ||
        p.metodo_pago.toLowerCase().includes(busq)
      );
    });
  });

  // ── Lifecycle ──────────────────────────────────────────────────
  async ngOnInit() {
    await this.cargarDatos();
    this.conectarRealtime();
  }

  ngOnDestroy() {
    if (this.canal) this.supabase.client.removeChannel(this.canal);
  }

  // ── Data loading ───────────────────────────────────────────────
  private async cargarDatos() {
    this.cargando.set(true);
    try {
      const raw = await this.supabase.getPedidos(undefined, 200);
      const pedidos = raw.map((p: any) => this.mapearPedido(p));
      this.pedidosTodos.set(pedidos);
      this.pedidosLive.set([...pedidos]);
      this.calcularResumenSucursales(pedidos);
    } catch (err) {
      console.warn('Supabase no disponible o sin datos, usando demo:', err);
      this.pedidosTodos.set(DEMO_PEDIDOS);
      this.pedidosLive.set([...DEMO_PEDIDOS]);
      this.calcularResumenSucursales(DEMO_PEDIDOS);
    } finally {
      this.cargando.set(false);
    }
  }

  private mapearPedido(raw: any): Pedido {
    return {
      id:             raw.id,
      created_at:     raw.created_at,
      total:          Number(raw.total) || 0,
      metodo_pago:    raw.metodo_pago || 'efectivo',
      estado:         raw.estado || 'completado',
      sucursal_id:    raw.sucursal_id,
      sucursal_nombre: raw.sucursales?.nombre || 'Sin sucursal',
      items: (raw.detalle_pedido || []).map((d: any) => ({
        nombre:          d.productos?.nombre || 'Producto',
        cantidad:        d.cantidad || 1,
        precio_unitario: Number(d.precio_unitario) || 0
      }))
    };
  }

  private calcularResumenSucursales(pedidos: Pedido[]) {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const map = new Map<number, ResumenSucursal>();

    pedidos.forEach(p => {
      if (new Date(p.created_at) < hoy) return;
      if (!map.has(p.sucursal_id)) {
        map.set(p.sucursal_id, {
          id: p.sucursal_id, nombre: p.sucursal_nombre,
          activa: true, totalDia: 0, cantidadVentas: 0, ticketPromedio: 0
        });
      }
      const s = map.get(p.sucursal_id)!;
      s.totalDia      += p.total;
      s.cantidadVentas += 1;
    });

    map.forEach(s => { s.ticketPromedio = s.cantidadVentas > 0 ? s.totalDia / s.cantidadVentas : 0; });

    // Añadir sucursales del demo que no tengan ventas
    DEMO_SUCURSALES.forEach(ds => {
      if (!map.has(ds.id)) map.set(ds.id, { ...ds });
    });

    this.resumenSucursales.set(Array.from(map.values()).sort((a,b) => b.totalDia - a.totalDia));
  }

  private conectarRealtime() {
    this.canal = this.supabase.escucharPedidosGlobal((raw: any) => {
      const nuevoPedido: Pedido = {
        id:             raw.id,
        created_at:     raw.created_at || new Date().toISOString(),
        total:          Number(raw.total) || 0,
        metodo_pago:    raw.metodo_pago || 'efectivo',
        estado:         raw.estado || 'completado',
        sucursal_id:    raw.sucursal_id,
        sucursal_nombre: 'En proceso...',
        items:          [],
        isNew:          true
      };

      this.pedidosLive.update(list => [nuevoPedido, ...list]);
      this.pedidosTodos.update(list => [nuevoPedido, ...list]);

      // Quitar la marca "new" después de 4 segundos
      setTimeout(() => {
        this.pedidosLive.update(list => list.map(p => p.id === nuevoPedido.id ? {...p, isNew: false} : p));
      }, 4000);
    });
  }

  // ── Drawer Sucursal ────────────────────────────────────────────
  async abrirDrawerSucursal(s: ResumenSucursal) {
    this.drawerSucursal.set(s);
    this.pedidosDrawer.set([]);
    this.cargandoDrawer.set(true);
    try {
      const raw = await this.supabase.getPedidos(s.id, 50);
      this.pedidosDrawer.set(raw.length > 0
        ? raw.map((p: any) => this.mapearPedido(p))
        : this.pedidosTodos().filter(p => p.sucursal_id === s.id)
      );
    } catch {
      this.pedidosDrawer.set(this.pedidosTodos().filter(p => p.sucursal_id === s.id));
    } finally {
      this.cargandoDrawer.set(false);
    }
  }

  cerrarDrawer() { this.drawerSucursal.set(null); }

  // ── Modal Detalle ──────────────────────────────────────────────
  abrirDetalle(p: Pedido) { this.pedidoDetalle.set(p); }
  cerrarDetalle()         { this.pedidoDetalle.set(null); }

  // ── Helpers ────────────────────────────────────────────────────
  getMetodoIcon(m: string): string {
    const mapa: Record<string,string> = {
      efectivo: 'payments', qr: 'qr_code_2', tarjeta: 'credit_card', transferencia: 'account_balance'
    };
    return mapa[m?.toLowerCase()] || 'payments';
  }

  getMetodoColor(m: string): string {
    const mapa: Record<string,string> = {
      efectivo: 'text-amber-400', qr: 'text-indigo-400', tarjeta: 'text-violet-400', transferencia: 'text-emerald-400'
    };
    return mapa[m?.toLowerCase()] || 'text-slate-400';
  }
}
