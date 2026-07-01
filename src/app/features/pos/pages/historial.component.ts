import { Component, computed, inject, signal, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { EdicionPedidoModalComponent } from '../components/edicion-pedido-modal.component';
import { TicketComponent, TicketData } from '../../ticket/ticket';
import { SupabaseService } from '../../../core/supabase.service';
import { AuthService } from '../../../core/auth.service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface LineaItem { nombre: string; cantidad: number; precio_unitario: number; }
interface Pedido    { id: number; created_at: string; total: number; metodo_pago: string; estado: string; cliente?: string; tipo_pedido?: 'mesa'|'llevar'; items: LineaItem[]; expanded?: boolean; }

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, TitleCasePipe, TicketComponent,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="his-root apple-font">

      <!-- Header (Apple Style) -->
      <div class="his-header">
        <div class="header-titles">
          <h2 class="page-title">Historial de Turno</h2>
          <p class="page-subtitle">{{ pedidos().length }} transacciones realizadas</p>
        </div>
        
        <div class="total-summary">
          <span class="ts-label">Total del Turno</span>
          <span class="ts-val">Bs. {{ totalHoy() | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Listado (Settings/Wallet Style) -->
      <div class="his-list">
        @if (loading()) {
          <div class="loader"><mat-spinner diameter="36"></mat-spinner></div>
        }

        <div class="card-list">
          @for (p of pedidos(); track p.id) {
            <div class="apple-card" [class.apple-card--anulado]="p.estado==='anulado'">

              <!-- Filas Principales -->
              <div class="card-row" (click)="p.expanded = !p.expanded">
                
                <!-- Icono Estado -->
                <div class="status-icon" [style]="statusStyle(p.estado)">
                  <mat-icon class="!text-[20px]">{{ p.estado==='anulado' ? 'cancel' : 'check_circle' }}</mat-icon>
                </div>

                <!-- Info -->
                <div class="order-info">
                  <div class="info-top">
                    <span class="order-id">#{{ p.id }}</span>
                    <span class="ios-badge" [style]="metodoBadge(p.metodo_pago)">{{ p.metodo_pago | titlecase }}</span>
                    @if (p.tipo_pedido) {
                      <span class="ios-badge badge-gray">
                        <mat-icon class="!text-[12px] align-text-bottom mr-1">{{ p.tipo_pedido === 'mesa' ? 'restaurant' : 'directions_walk' }}</mat-icon>
                        {{ p.tipo_pedido === 'mesa' ? 'Mesa' : 'Llevar' }}
                      </span>
                    }
                  </div>
                  <p class="order-time">
                    {{ p.created_at | date:'HH:mm' }} — {{ p.created_at | date:'dd/MM/yyyy' }}
                    @if (p.cliente) { <span class="client-name">· {{ p.cliente }}</span> }
                  </p>
                </div>

                <!-- Total y Chevron -->
                <div class="order-right">
                  <span class="order-total" [class.line-through]="p.estado==='anulado'">Bs. {{ p.total | number:'1.2-2' }}</span>
                  <div class="chevron transition-transform duration-200" [class.rotate-180]="p.expanded">
                    <mat-icon style="color:#C7C7CC">chevron_right</mat-icon>
                  </div>
                </div>
              </div>

              <!-- Detalle Expandible -->
              @if (p.expanded) {
                <div class="card-detail">
                  <div class="detail-inset">
                    <div class="items-head">
                      <span>Producto</span>
                      <span class="text-right">Cant</span>
                      <span class="text-right">P/U</span>
                      <span class="text-right">Total</span>
                    </div>
                    @for (it of p.items; track it.nombre) {
                      <div class="item-row">
                        <span class="item-name">{{ it.nombre }}</span>
                        <span class="text-right text-gray-500">{{ it.cantidad }}</span>
                        <span class="text-right text-gray-500">Bs. {{ it.precio_unitario | number:'1.2-2' }}</span>
                        <span class="text-right font-semibold">Bs. {{ it.cantidad * it.precio_unitario | number:'1.2-2' }}</span>
                      </div>
                    }
                  </div>

                  @if (p.estado !== 'anulado') {
                    <div class="action-buttons">
                      <button class="sys-btn sys-btn--gray" (click)="reimprimir(p)">
                        <mat-icon class="!text-[18px]">print</mat-icon> Reimprimir
                      </button>
                      <button class="sys-btn sys-btn--yellow" (click)="editarPedido(p)">
                        <mat-icon class="!text-[18px]">edit</mat-icon> Editar
                      </button>
                      <button class="sys-btn sys-btn--red" (click)="anular(p)">
                        <mat-icon class="!text-[18px]">cancel</mat-icon> Anular
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (!loading() && pedidos().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><mat-icon class="!text-[40px] !w-[40px] !h-[40px]">receipt_long</mat-icon></div>
            <p class="empty-title">Sin ventas todavía</p>
            <p class="empty-sub">Las transacciones del turno aparecerán aquí.</p>
          </div>
        }
      </div>

      <!-- Ticket -->
      <app-ticket [ticketData]="ticketActual"></app-ticket>
    </div>
  `,
  styles: [`
    .apple-font {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .his-root { display: flex; flex-direction: column; height: 100%; background: transparent; }

    /* Header */
    .his-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 32px 32px 16px; flex-shrink: 0;
      @media (max-width: 1023px) and (min-width: 768px) { padding: 24px 24px 12px; }
      @media (max-width: 767px) { flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px 16px 12px; }
    }
    .page-title { margin: 0; font-size: 2rem; font-weight: 700; color: #000000; letter-spacing: -0.03em; line-height: 1.1; @media (max-width: 767px) { font-size: 1.4rem; } }
    .page-subtitle { margin: 4px 0 0; font-size: 0.95rem; color: #8E8E93; font-weight: 500; @media (max-width: 767px) { font-size: 0.8rem; } }

    .total-summary {
      display: flex; flex-direction: column; align-items: flex-end;
      @media (max-width: 767px) { flex-direction: row; align-items: center; gap: 8px; width: 100%; justify-content: space-between; }
    }
    .ts-label { font-size: 0.75rem; font-weight: 700; color: #8E8E93; text-transform: uppercase; letter-spacing: 0.05em; @media (max-width: 767px) { font-size: 0.65rem; } }
    .ts-val   { font-size: 1.5rem; font-weight: 800; color: #007AFF; letter-spacing: -0.02em; margin-top: 2px; @media (max-width: 767px) { font-size: 1.1rem; margin-top: 0; } }

    /* List Area */
    .his-list { flex: 1; overflow-y: auto; padding: 16px 32px 40px; @media (max-width: 1023px) and (min-width: 768px) { padding: 12px 24px 32px; } @media (max-width: 767px) { padding: 8px 16px 24px; } }
    .loader { display: flex; justify-content: center; padding: 40px; }

    .card-list { display: flex; flex-direction: column; gap: 16px; @media (max-width: 767px) { gap: 10px; } }

    /* Apple Cards */
    .apple-card {
      background: #FFFFFF; border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
      display: flex; flex-direction: column; overflow: hidden;
      transition: opacity 0.2s;
      @media (max-width: 767px) { border-radius: 14px; }
    }
    .apple-card--anulado { opacity: 0.6; }

    .card-row {
      display: flex; align-items: center; padding: 16px 20px;
      cursor: pointer; transition: background 0.15s;
      @media (max-width: 767px) { padding: 12px 14px; }
    }
    .card-row:active { background: #F2F2F7; }

    .status-icon {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-right: 16px; flex-shrink: 0;
      @media (max-width: 767px) { width: 36px; height: 36px; margin-right: 10px; }
    }

    .order-info { flex: 1; min-width: 0; }
    .info-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 2px; }
    .order-id { font-size: 1.05rem; font-weight: 700; color: #000000; letter-spacing: -0.01em; @media (max-width: 767px) { font-size: 0.9rem; } }
    
    .ios-badge {
      padding: 3px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 600;
      letter-spacing: 0.02em; border: 0.5px solid rgba(0,0,0,0.05);
      display: inline-flex; align-items: center; gap: 2px;
      @media (max-width: 767px) { font-size: 0.6rem; padding: 2px 6px; }
    }
    .badge-gray { background: #F2F2F7; color: #8E8E93; }

    .order-time { margin: 0; font-size: 0.85rem; color: #8E8E93; font-weight: 500; @media (max-width: 767px) { font-size: 0.72rem; } }
    .client-name { color: #1C1C1E; font-weight: 600; }

    .order-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; @media (max-width: 767px) { gap: 6px; flex-direction: column-reverse; align-items: flex-end; } }
    .order-total { font-size: 1.15rem; font-weight: 700; color: #000000; letter-spacing: -0.02em; @media (max-width: 767px) { font-size: 0.9rem; } }
    .chevron { display: flex; align-items: center; justify-content: center; width: 20px; @media (max-width: 767px) { width: 16px; } }
    
    .rotate-180 { transform: rotate(90deg) !important; color: #000000 !important; }

    /* Expanded Detail */
    .card-detail {
      padding: 0 20px 20px 76px;
      background: #FFFFFF;
      @media (max-width: 767px) { padding: 0 14px 14px 60px; }
    }

    .detail-inset {
      background: #F8F9FA; border-radius: 12px; padding: 12px 16px;
      margin-bottom: 14px; border: 0.5px solid rgba(0,0,0,0.04);
      @media (max-width: 767px) { padding: 10px 12px; border-radius: 10px; margin-bottom: 10px; }
    }
    .items-head {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 4px;
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #8E8E93;
      padding-bottom: 8px; border-bottom: 0.5px solid #E5E5EA; margin-bottom: 8px;
      @media (max-width: 767px) { font-size: 0.6rem; gap: 2px; grid-template-columns: 1.5fr 0.7fr 0.8fr 0.8fr; }
    }
    .item-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 4px;
      font-size: 0.85rem; color: #1C1C1E; padding: 4px 0;
      @media (max-width: 767px) { font-size: 0.75rem; gap: 2px; grid-template-columns: 1.5fr 0.7fr 0.8fr 0.8fr; }
    }
    .item-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Action Buttons */
    .action-buttons { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; @media (max-width: 767px) { gap: 6px; } }
    .sys-btn {
      display: flex; align-items: center; gap: 4px; padding: 8px 14px;
      border-radius: 12px; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      border: none; transition: transform 0.1s, opacity 0.2s;
      @media (max-width: 767px) { font-size: 0.72rem; padding: 6px 10px; border-radius: 10px; }
    }
    .sys-btn:active { transform: scale(0.96); }
    .sys-btn--gray { background: #F2F2F7; color: #000000; }
    .sys-btn--yellow { background: #FFF9D1; color: #B28600; }
    .sys-btn--red { background: #FFD4D4; color: #C90000; }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; @media (max-width: 767px) { padding: 40px 16px; } }
    .empty-icon { width: 80px; height: 80px; border-radius: 40px; background: #E5E5EA; display: flex; align-items: center; justify-content: center; color: #8E8E93; margin-bottom: 16px; @media (max-width: 767px) { width: 56px; height: 56px; } }
    .empty-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #000000; @media (max-width: 767px) { font-size: 1rem; } }
    .empty-sub   { margin: 4px 0 0; font-size: 0.95rem; color: #8E8E93; @media (max-width: 767px) { font-size: 0.82rem; } }
  `]
})
export class HistorialComponent implements OnInit, OnDestroy {
  @ViewChild(TicketComponent) ticketRef!: TicketComponent;
  private dialog = inject(MatDialog);
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private canal: any = null;
  
  pedidos   = signal<Pedido[]>([]);
  loading   = signal(false);
  totalHoy  = computed(() => this.pedidos().filter(p => p.estado !== 'anulado').reduce((s, p) => s + p.total, 0));

  ticketActual: TicketData = { fecha: '', hora: '', mesa: '', pedidoId: 0, items: [], total: 0, metodoPago: 'efectivo' };

  ngOnInit() {
    this.loadPedidos();
    // Escuchar nuevos pedidos en tiempo real para refrescar la lista
    this.canal = this.supabase.escucharVentasEnVivo(() => {
      this.loadPedidos();
    });
  }

  ngOnDestroy() {
    if (this.canal) this.supabase.client.removeChannel(this.canal);
  }

  statusStyle(e: string) {
    return e === 'anulado'
      ? 'background: #FFE5E5; color: #FF3B30;'
      : 'background: #E5F4EA; color: #34C759;';
  }
  metodoBadge(m: string) {
    const map: Record<string, string> = {
      efectivo: 'background:#E5F4EA;color:#34C759', // iOS Green
      qr:       'background:#FFF4E5;color:#FF9500', // iOS Orange
      tarjeta:  'background:#F2E5FF;color:#AF52DE', // iOS Purple
    };
    return map[m] ?? 'background:#F2F2F7;color:#8E8E93';
  }

  async anular(p: Pedido) {
    if (!confirm(`¿Anular venta #${p.id}?`)) return;
    try {
      await this.supabase.anularPedido(p.id);
      this.pedidos.update(l => l.map(x => x.id === p.id ? { ...x, estado: 'anulado' } : x));
    } catch (e) {
      console.error('Error al anular pedido', e);
      alert('No se pudo anular el pedido.');
    }
  }

  editarPedido(p: Pedido) {
    const ref = this.dialog.open(EdicionPedidoModalComponent, {
      width: '1000px', maxWidth: '95vw', disableClose: true, data: { pedido: p },
      panelClass: 'apple-modal'
    });

    ref.afterClosed().subscribe(res => {
      if (res?.exito) {
        this.pedidos.update(list => list.map(order => 
          order.id === p.id ? { ...order, items: res.items, total: res.nuevoTotal } : order
        ));
      }
    });
  }

  private async loadPedidos() {
    this.loading.set(true);
    try {
      // Filtrar por la sucursal activa del usuario y por el usuario actual (empleado)
      const sucursalId = this.auth.userSucursal() || 1;
      const session = await this.supabase.client.auth.getSession();
      const usuarioId = session.data.session?.user?.id;

      const dbPedidos = await this.supabase.getPedidos(sucursalId, usuarioId);

      const filtered = dbPedidos.filter((p: any) => {
        // apertura_cajas puede ser un objeto o array según la FK de Supabase
        const apertura = Array.isArray(p.apertura_cajas) ? p.apertura_cajas[0] : p.apertura_cajas;
        // Filtrar por sucursal Y por usuario (cajero)
        return apertura?.sucursal_id === sucursalId && apertura?.usuario_id === usuarioId;
      });
      
      const mapeados = filtered.map((p: any) => {
        // apertura_cajas puede ser objeto o array
        const apertura = Array.isArray(p.apertura_cajas) ? p.apertura_cajas[0] : p.apertura_cajas;
        // pagos puede ser objeto o array
        const primerPago = Array.isArray(p.pagos) ? p.pagos[0] : p.pagos;
        // detalle_pedidos siempre debe ser array
        const detalles: any[] = Array.isArray(p.detalle_pedidos) ? p.detalle_pedidos : (p.detalle_pedidos ? [p.detalle_pedidos] : []);

        return {
          id: p.id,
          created_at: p.created_at,
          total: p.total,
          metodo_pago: primerPago?.metodo || 'efectivo',
          estado: p.estado,
          cliente: p.cliente_nombre || '',
          tipo_pedido: p.numero_mesa ? 'mesa' : 'llevar',
          items: detalles.map((det: any) => {
            // productos puede ser objeto o array en Supabase
            const prod = Array.isArray(det.productos) ? det.productos[0] : det.productos;
            return {
              nombre: prod?.nombre || 'Producto',
              cantidad: det.cantidad || 1,
              precio_unitario: Number(det.precio_unitario) || 0
            };
          })
        };
      });
      this.pedidos.set(mapeados as any[]);
    } catch (e) {
      console.error('Error cargando historial', e);
    } finally {
      this.loading.set(false);
    }
  }

  reimprimir(p: Pedido) {
    const fecha = new Date(p.created_at);
    this.ticketActual = {
      fecha: fecha.toLocaleDateString('es-BO'), hora: fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      mesa: p.cliente || 'Genérico', pedidoId: p.id,
      items: p.items.map(it => ({ cantidad: it.cantidad, nombre: it.nombre, precioUnitario: it.precio_unitario, subtotal: it.cantidad * it.precio_unitario })),
      total: p.total, metodoPago: p.metodo_pago as 'efectivo' | 'qr' | 'tarjeta', tipoOrden: p.tipo_pedido === 'llevar' ? 'para_llevar' : 'mesa'
    };
    this.ticketRef.imprimir();
  }
}
