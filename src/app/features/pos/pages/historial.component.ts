import { Component, computed, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { EdicionPedidoModalComponent } from '../components/edicion-pedido-modal.component';
import { TicketComponent, TicketData } from '../../ticket/ticket';

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
                        <mat-icon class="!text-[12px] align-text-bottom mr-1">{{ p.tipo_pedido === 'mesa' ? 'restaurant' : 'takeout_dining' }}</mat-icon>
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
    }
    .page-title { margin: 0; font-size: 2rem; font-weight: 700; color: #000000; letter-spacing: -0.03em; line-height: 1.1; }
    .page-subtitle { margin: 4px 0 0; font-size: 0.95rem; color: #8E8E93; font-weight: 500;}

    .total-summary {
      display: flex; flex-direction: column; align-items: flex-end;
    }
    .ts-label { font-size: 0.75rem; font-weight: 700; color: #8E8E93; text-transform: uppercase; letter-spacing: 0.05em; }
    .ts-val   { font-size: 1.5rem; font-weight: 800; color: #007AFF; letter-spacing: -0.02em; margin-top: 2px;}

    /* List Area */
    .his-list { flex: 1; overflow-y: auto; padding: 16px 32px 40px; }
    .loader { display: flex; justify-content: center; padding: 40px; }

    .card-list { display: flex; flex-direction: column; gap: 16px; }

    /* Apple Cards */
    .apple-card {
      background: #FFFFFF; border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
      display: flex; flex-direction: column; overflow: hidden;
      transition: opacity 0.2s;
    }
    .apple-card--anulado { opacity: 0.6; }

    .card-row {
      display: flex; align-items: center; padding: 16px 20px;
      cursor: pointer; transition: background 0.15s;
    }
    .card-row:active { background: #F2F2F7; }

    .status-icon {
      width: 44px; height: 44px; border-radius: 50%; /* Circle */
      display: flex; align-items: center; justify-content: center;
      margin-right: 16px; flex-shrink: 0;
    }

    .order-info { flex: 1; min-width: 0; }
    .info-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 2px;}
    .order-id { font-size: 1.05rem; font-weight: 700; color: #000000; letter-spacing: -0.01em;}
    
    .ios-badge {
      padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; 
      letter-spacing: 0.02em; border: 0.5px solid rgba(0,0,0,0.05);
    }
    .badge-gray { background: #F2F2F7; color: #8E8E93; }

    .order-time { margin: 0; font-size: 0.85rem; color: #8E8E93; font-weight: 500;}
    .client-name { color: #1C1C1E; }

    .order-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .order-total { font-size: 1.15rem; font-weight: 700; color: #000000; letter-spacing: -0.02em;}
    .chevron { display: flex; align-items: center; justify-content: center; width: 24px; }
    
    .rotate-180 { transform: rotate(90deg) !important; color: #000000 !important; }

    /* Expanded Detail */
    .card-detail {
      padding: 0 20px 20px 76px; /* Offset to align with text */
      background: #FFFFFF;
    }

    .detail-inset {
      background: #F8F9FA; border-radius: 12px; padding: 12px 16px;
      margin-bottom: 16px; border: 0.5px solid rgba(0,0,0,0.04);
    }
    .items-head {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px;
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #8E8E93;
      padding-bottom: 8px; border-bottom: 0.5px solid #E5E5EA; margin-bottom: 8px;
    }
    .item-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px;
      font-size: 0.85rem; color: #1C1C1E; padding: 4px 0;
    }
    .item-name { font-weight: 500; }

    /* Action Buttons */
    .action-buttons { display: flex; gap: 10px; justify-content: flex-end; }
    .sys-btn {
      display: flex; align-items: center; gap: 6px; padding: 8px 16px;
      border-radius: 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      border: none; transition: transform 0.1s, opacity 0.2s;
    }
    .sys-btn:active { transform: scale(0.96); }
    .sys-btn--gray { background: #F2F2F7; color: #000000; }
    .sys-btn--yellow { background: #FFF9D1; color: #B28600; }
    .sys-btn--red { background: #FFD4D4; color: #C90000; }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
    .empty-icon { width: 80px; height: 80px; border-radius: 40px; background: #E5E5EA; display: flex; align-items: center; justify-content: center; color: #8E8E93; margin-bottom: 16px; }
    .empty-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #000000; }
    .empty-sub   { margin: 4px 0 0; font-size: 0.95rem; color: #8E8E93; }
  `]
})
export class HistorialComponent implements OnInit {
  @ViewChild(TicketComponent) ticketRef!: TicketComponent;
  private dialog = inject(MatDialog);
  
  pedidos   = signal<Pedido[]>([]);
  loading   = signal(false);
  totalHoy  = computed(() => this.pedidos().filter(p => p.estado !== 'anulado').reduce((s, p) => s + p.total, 0));

  ticketActual: TicketData = { fecha: '', hora: '', mesa: '', pedidoId: 0, items: [], total: 0, metodoPago: 'efectivo' };

  ngOnInit() { this.loadDemo(); }

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

  anular(p: Pedido) {
    if (!confirm(`¿Anular venta #${p.id}?`)) return;
    this.pedidos.update(l => l.map(x => x.id === p.id ? { ...x, estado: 'anulado' } : x));
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

  private loadDemo() {
    this.pedidos.set([
      { id: 1003, created_at: new Date().toISOString(), total: 90, metodo_pago: 'efectivo', estado: 'pagado', cliente: 'María López', tipo_pedido: 'mesa', items: [{ nombre: 'Kjara Especial', cantidad: 2, precio_unitario: 45 }] },
      { id: 1002, created_at: new Date(Date.now()-1800000).toISOString(), total: 33, metodo_pago: 'qr', estado: 'pagado', cliente: 'Cliente General', tipo_pedido: 'llevar', items: [{ nombre: 'Kjara Pequeña', cantidad: 1, precio_unitario: 30 }, { nombre: 'Chorizo Extra', cantidad: 1, precio_unitario: 3 }] },
      { id: 1001, created_at: new Date(Date.now()-3600000).toISOString(), total: 45, metodo_pago: 'tarjeta', estado: 'anulado', cliente: 'Carlos Vargas', tipo_pedido: 'mesa', items: [{ nombre: 'Kjara Especial', cantidad: 1, precio_unitario: 45 }] },
    ]);
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
