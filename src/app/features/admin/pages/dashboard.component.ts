import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/supabase.service';

// Material Design 3 Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DetalleVentaModalComponent } from '../components/detalle-venta-modal.component';

interface ResumenVentas {
  productosInventario: number;
  usuariosActivos: number;
  ventasHoy: number;
  ingresosHoy: number;
}

interface VentaReciente {
  id: number;
  sucursal: string;
  hora: string;
  metodo: string;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatDialogModule,
    MatTooltipModule
  ],
  template: `
    <div class="p-4 md:p-8 bg-[#13131A] min-h-screen text-slate-200 font-sans tracking-wide">
      
      <div class="max-w-[1400px] mx-auto flex flex-col gap-6">

        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <mat-icon class="text-indigo-400 scale-75">dashboard</mat-icon>
            </div>
            <h1 class="text-xl font-semibold text-white m-0 tracking-tight">Overview</h1>
          </div>
          <div class="flex items-center gap-4">
            <button mat-icon-button class="text-slate-400 hover:text-white"><mat-icon>notifications_none</mat-icon></button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div class="dark-card lg:col-span-1 p-5 flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            
            <div>
              <span class="text-[13px] font-medium text-slate-400">Ingresos Hoy</span>
              <div class="text-4xl font-light text-white mt-2 tracking-tight">
                Bs. {{ estadisticas().ingresosHoy | number:'1.2-2' }}
              </div>
            </div>
            
            <div class="flex items-center gap-4 mt-8">
              <div class="flex-1 bg-[#1A1A24] rounded-xl p-3 border border-[#2D2D3D]">
                <span class="text-xs text-slate-500 block mb-1">Crecimiento</span>
                <span class="text-emerald-400 text-sm font-medium flex items-center"><mat-icon class="scale-[0.6] -ml-1">trending_up</mat-icon> +12.5%</span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            <div class="dark-card p-5 flex flex-col justify-center relative overflow-hidden">
              <div class="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full"></div>
              <span class="text-[13px] font-medium text-slate-400 mb-1">Ventas Hoy</span>
              <div class="flex items-end justify-between">
                <span class="text-3xl font-medium text-white">{{ estadisticas().ventasHoy }}</span>
                <div class="text-indigo-400 text-xs font-medium flex items-center bg-indigo-500/10 px-2 py-1 rounded-md">
                  <mat-icon class="scale-[0.5] -mx-1">fiber_manual_record</mat-icon> En vivo
                </div>
              </div>
            </div>

            <div class="dark-card p-5 flex flex-col justify-center relative overflow-hidden">
              <div class="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-bl-full"></div>
              <span class="text-[13px] font-medium text-slate-400 mb-1">Productos Activos</span>
              <div class="flex items-end justify-between">
                <span class="text-3xl font-medium text-white">{{ estadisticas().productosInventario }}</span>
                <mat-icon class="text-amber-500/50">inventory_2</mat-icon>
              </div>
            </div>

            <div class="dark-card p-5 flex flex-col justify-center relative overflow-hidden">
              <div class="absolute right-0 top-0 w-24 h-24 bg-violet-500/5 rounded-bl-full"></div>
              <span class="text-[13px] font-medium text-slate-400 mb-1">Usuarios Online</span>
              <div class="flex items-end justify-between">
                <span class="text-3xl font-medium text-white">{{ estadisticas().usuariosActivos }}</span>
                <mat-icon class="text-violet-500/50">group</mat-icon>
              </div>
            </div>

          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div class="dark-card xl:col-span-2 p-6 flex flex-col">
            <div class="flex justify-between items-center mb-8">
              <div>
                <h2 class="text-base font-semibold text-white m-0">Flujo de Ventas</h2>
                <p class="text-xs text-slate-500 mt-1">Comparativa mensual de transacciones</p>
              </div>
              <select class="bg-[#1A1A24] border border-[#2D2D3D] text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500">
                <option>Este Año</option>
                <option>Año Pasado</option>
              </select>
            </div>

            <div class="flex items-end justify-between gap-2 h-56 mt-auto relative pb-6 border-b border-[#2D2D3D]">
              <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-500 font-medium pb-6 -ml-4">
                <span>400</span><span>300</span><span>200</span><span>100</span>
              </div>

              @for (bar of salesData(); track bar.month) {
                <div class="flex flex-col items-center gap-3 w-full z-10 h-full justify-end group">
                  <div 
                    class="w-full max-w-[32px] rounded-t-lg transition-all duration-300 cursor-pointer relative"
                    [ngClass]="bar.value > 80 ? 'bg-gradient-to-t from-indigo-900/40 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-[#2D2D3D] group-hover:bg-[#3D3D4D]'"
                    [style.height.%]="bar.value">
                    
                    <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#13131A] border border-[#2D2D3D] text-white text-[10px] px-2 py-1 rounded shadow-xl transition-opacity whitespace-nowrap">
                      {{ bar.value }} ventas
                    </div>
                  </div>
                  <span class="text-[11px] text-slate-500 font-medium absolute -bottom-6">{{ bar.month }}</span>
                </div>
              }
            </div>
          </div>

          <div class="dark-card xl:col-span-1 p-6 flex flex-col">
            <h2 class="text-base font-semibold text-white mb-6">Reglas de Ahorro / Metas</h2>
            
            <div class="space-y-4 flex-1">
              <div class="bg-[#1A1A24] border border-[#2D2D3D] rounded-xl p-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-white">Meta Mensual</span>
                  <mat-icon class="text-indigo-400 scale-75">more_vert</mat-icon>
                </div>
                <div class="flex justify-between items-end mb-2">
                  <span class="text-2xl font-light text-white">Bs. {{ estadisticas().ingresosHoy }}</span>
                  <span class="text-sm text-slate-500">de Bs. 5000</span>
                </div>
                <div class="w-full h-1.5 bg-[#2D2D3D] rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-emerald-400 to-indigo-500" [style.width.%]="(estadisticas().ingresosHoy / 5000) * 100"></div>
                </div>
              </div>

              <div class="pt-4 space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2 text-slate-300">
                    <div class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                    Transferencias
                  </div>
                  <span class="text-white">45%</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2 text-slate-300">
                    <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    Efectivo
                  </div>
                  <span class="text-white">30%</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2 text-slate-300">
                    <div class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                    QR
                  </div>
                  <span class="text-white">25%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="dark-card p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-base font-semibold text-white m-0 flex items-center gap-2">
              Transacciones Recientes
              <span class="live-dot-glow ml-2"></span>
            </h2>
            <button mat-icon-button class="text-slate-400 hover:text-white"><mat-icon>sensors</mat-icon></button>
          </div>

          <div class="overflow-x-auto">
            <table class="dashboard-table text-left border-collapse">
              <thead>
                <tr class="text-[10px] text-slate-500 uppercase tracking-widest border-b border-[#2D2D3D]">
                  <th class="pb-3 font-medium">Ticket / ID</th>
                  <th class="pb-3 font-medium">Hora</th>
                  <th class="pb-3 font-medium">Sucursal</th>
                  <th class="pb-3 font-medium">Método</th>
                  <th class="pb-3 font-medium text-right">Monto</th>
                  <th class="pb-3"></th>
                </tr>
              </thead>
              <tbody class="text-sm">
                @for (venta of ultimasVentas(); track venta.id) {
                  <tr 
                    class="border-b border-[#2D2D3D]/50 hover:bg-[#1A1A24] transition-colors cursor-pointer group"
                    (click)="abrirDetalleVenta(venta)">
                    <td class="py-4 text-slate-300 font-medium">#{{ venta.id }}</td>
                    <td class="py-4 text-slate-400">{{ venta.hora }}</td>
                    <td class="py-4 text-slate-300">{{ venta.sucursal }}</td>
                    <td class="py-4">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1A1A24] border border-[#2D2D3D]" [ngClass]="getColorPorMetodo(venta.metodo)">
                        <mat-icon class="scale-[0.6] -ml-1">{{ getMetodoIcon(venta.metodo) }}</mat-icon>
                        {{ venta.metodo | uppercase }}
                      </span>
                    </td>
                    <td class="py-4 text-right font-medium text-white">Bs. {{ venta.total | number:'1.2-2' }}</td>
                    <td class="py-4 text-right">
                      <mat-icon class="text-slate-600 group-hover:text-indigo-400 scale-75 transition-colors">more_vert</mat-icon>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-500">
                      <mat-icon class="opacity-50 mb-2 text-3xl">hourglass_empty</mat-icon>
                      <p class="text-sm">Esperando transacciones...</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ====== Estilos base Finwave ====== */
    .dark-card {
      background: #1C1C24;
      border: 1px solid #2D2D3D;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    /* ====== Live Dots ====== */
    .live-dot-glow {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 10px #10b981;
      animation: pulse-glow 2s infinite;
    }

    @keyframes pulse-glow {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Ajuste de scrollbar para modo oscuro */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #2D2D3D; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3D3D4D; }

    /* ====== Responsive Mobile ====== */
    .dashboard-table { width: 100%; min-width: 480px; }

    @media (max-width: 480px) {
      /* KPI top cards compact */
      .dark-card { border-radius: 12px; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private dialog = inject(MatDialog);
  private canalVentas: any;

  estadisticas = signal<ResumenVentas>({
    productosInventario: 0,
    usuariosActivos: 0,
    ventasHoy: 0,
    ingresosHoy: 0
  });

  ultimasVentas = signal<VentaReciente[]>([]);

  salesData = signal([
    { month: 'Mon', value: 20 },
    { month: 'Tue', value: 45 },
    { month: 'Wed', value: 35 },
    { month: 'Thu', value: 38 },
    { month: 'Fri', value: 90 }, // Destacado
    { month: 'Sat', value: 65 },
    { month: 'Sun', value: 60 }
  ]);

  ngOnInit() {
    this.cargarDatosIniciales();
    this.conectarRadarEnVivo();
  }

  ngOnDestroy() {
    if (this.canalVentas) {
      this.supabase.client.removeChannel(this.canalVentas);
    }
  }

  abrirDetalleVenta(venta: VentaReciente) {
    this.dialog.open(DetalleVentaModalComponent, {
      data: venta,
      panelClass: 'dark-theme-dialog', // Recomendable crear esta clase en tu styles.scss global
      autoFocus: false,
      width: '500px'
    });
  }

  getMetodoIcon(metodo: string): string {
    const iconos: Record<string, string> = {
      'efectivo': 'payments',
      'qr': 'qr_code_2',
      'tarjeta': 'credit_card',
      'transferencia': 'account_balance'
    };
    return iconos[metodo.toLowerCase()] || 'payments';
  }

  // Mantiene tus colores pero adaptados a modo oscuro
  getColorPorMetodo(metodo: string): string {
    const colores: Record<string, string> = {
      'efectivo': 'text-amber-400',
      'qr': 'text-indigo-400',
      'tarjeta': 'text-violet-400',
      'transferencia': 'text-emerald-400'
    };
    return colores[metodo.toLowerCase()] || 'text-slate-400';
  }

  private async cargarDatosIniciales() {
    try {
      const [prods, users, pedidos] = await Promise.all([
        this.supabase.getProductos(),
        this.supabase.getUsuariosAdmin(),
        this.supabase.getPedidos()
      ]);

      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();

      const pedidosHoy = pedidos.filter(p => {
        const d = new Date(p.created_at).getTime();
        return d >= inicioHoy;
      });

      const ingresosHoy = pedidosHoy.reduce((sum, p) => sum + p.total, 0);

      this.estadisticas.set({
        productosInventario: prods.length,
        usuariosActivos: users.length,
        ventasHoy: pedidosHoy.length,
        ingresosHoy: ingresosHoy
      });

      // Últimas ventas ordenadas por fecha
      const ultimas = pedidos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
      
      this.ultimasVentas.set(ultimas.map((p: any) => ({
        id: p.id,
        sucursal: p.apertura_cajas?.sucursales?.nombre || `Sucursal #${p.apertura_cajas?.sucursal_id || 'N/A'}`,
        hora: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metodo: p.pagos && p.pagos.length > 0 ? p.pagos[0].metodo : 'efectivo',
        total: p.total
      })));
    } catch (error) {
      console.error('Error cargando datos del dashboard', error);
    }
  }

  private conectarRadarEnVivo() {
    this.canalVentas = this.supabase.escucharVentasEnVivo((payload: any) => {
      const { eventType, new: nuevo, old: antiguo } = payload;

      if (eventType === 'INSERT') {
        // Nuevo pedido: agregar a estadísticas y lista
        this.estadisticas.update(statsActuales => ({
          ...statsActuales,
          ventasHoy: statsActuales.ventasHoy + 1,
          ingresosHoy: statsActuales.ingresosHoy + Number(nuevo.total)
        }));

        const nuevaTransaccion: VentaReciente = {
          id: nuevo.id,
          sucursal: 'En proceso...',
          hora: new Date(nuevo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metodo: 'efectivo',
          total: Number(nuevo.total)
        };

        this.ultimasVentas.update(ventasAnteriores => [nuevaTransaccion, ...ventasAnteriores].slice(0, 10));
      }
      else if (eventType === 'UPDATE') {
        // Pedido actualizado: verificar si se anuló
        if (antiguo.estado !== nuevo.estado && nuevo.estado === 'anulado') {
          // Restar de estadísticas
          this.estadisticas.update(statsActuales => ({
            ...statsActuales,
            ventasHoy: Math.max(0, statsActuales.ventasHoy - 1),
            ingresosHoy: Math.max(0, statsActuales.ingresosHoy - Number(antiguo.total))
          }));

          // Remover de la lista de últimas ventas
          this.ultimasVentas.update(ventasAnteriores =>
            ventasAnteriores.filter(v => v.id !== antiguo.id)
          );
        } else if (antiguo.total !== nuevo.total) {
          // Si cambió el monto, actualizar estadísticas
          const diferencia = Number(nuevo.total) - Number(antiguo.total);
          this.estadisticas.update(statsActuales => ({
            ...statsActuales,
            ingresosHoy: statsActuales.ingresosHoy + diferencia
          }));

          // Actualizar en la lista
          this.ultimasVentas.update(ventasAnteriores =>
            ventasAnteriores.map(v =>
              v.id === antiguo.id ? { ...v, total: Number(nuevo.total) } : v
            )
          );
        }
      }
      else if (eventType === 'DELETE') {
        // Pedido eliminado: restar de estadísticas y remover de lista
        this.estadisticas.update(statsActuales => ({
          ...statsActuales,
          ventasHoy: Math.max(0, statsActuales.ventasHoy - 1),
          ingresosHoy: Math.max(0, statsActuales.ingresosHoy - Number(antiguo.total))
        }));

        this.ultimasVentas.update(ventasAnteriores =>
          ventasAnteriores.filter(v => v.id !== antiguo.id)
        );
      }
    });
  }
}