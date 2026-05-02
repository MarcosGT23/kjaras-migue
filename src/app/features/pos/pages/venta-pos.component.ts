import { MatDialog } from '@angular/material/dialog';
import { CobroModalComponent } from '../components/cobro-modal.component';
import { CajaCerradaModalComponent } from '../components/caja-cerrada-modal.component';
import { Component, computed, signal, OnInit, inject, ViewChild } from '@angular/core';
import { CajaService } from '../../../core/caja.service';
import { SupabaseService } from '../../../core/supabase.service';
import { AuthService } from '../../../core/auth.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketComponent, TicketData } from '../../ticket/ticket';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Producto { id: number; nombre: string; precio_base: number; categoria_id: number; emoji?: string; }
interface ItemCarrito { producto: Producto; cantidad: number; subtotal: number; }
interface Categoria { id: number; nombre: string; icon: string; }

@Component({
  selector: 'app-venta-pos',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule, TicketComponent,
    MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="pos-root apple-font">

      <!-- ════════ CATALOGO (Izquierda) ════════ -->
      <section class="catalogue">

        <!-- Header / Buscador / Categorías -->
        <div class="cat-header">
          <div class="header-top">
            <h1 class="page-title">Punto de Venta</h1>
            
            <!-- Apple iOS Search Bar -->
            <div class="ios-search">
              <mat-icon class="search-icon">search</mat-icon>
              <input class="search-input" type="text" placeholder="Buscar productos..."
                     [(ngModel)]="busquedaVal" (ngModelChange)="busqueda.set($event)">
              @if (busqueda()) {
                <button class="search-clear" (click)="busqueda.set(''); busquedaVal=''">
                  <mat-icon class="!text-[14px]">close</mat-icon>
                </button>
              }
            </div>
          </div>

          <!-- iOS Segmented Control / Pills -->
          <div class="cat-pills">
            <button class="ios-pill" [class.ios-pill--active]="catActiva() === 0" (click)="catActiva.set(0)">
              Todos
            </button>
            @for (c of categorias(); track c.id) {
              <button class="ios-pill" [class.ios-pill--active]="catActiva() === c.id" (click)="catActiva.set(c.id)">
                {{ c.nombre }}
              </button>
            }
          </div>
        </div>

        <!-- Grid de Productos -->
        <div class="prod-grid">
          @for (p of filtrados(); track p.id) {
            <div class="apple-card group" [class.apple-card--in]="cantCart(p.id) > 0" (click)="add(p)">
              <!-- Emoji / Image Area -->
              <div class="card-image-area">
                <span class="card-emoji">{{ p.emoji ?? '🍽️' }}</span>
                @if (cantCart(p.id) > 0) {
                  <div class="ios-badge bounce-in">{{ cantCart(p.id) }}</div>
                }
              </div>
              
              <!-- Detalles -->
              <div class="card-details">
                <p class="card-title">{{ p.nombre }}</p>
                <p class="card-price">Bs. {{ p.precio_base | number:'1.2-2' }}</p>
              </div>
            </div>
          }

          @if (filtrados().length === 0) {
            <div class="empty-state">
              <mat-icon class="!text-[48px] !w-[48px] !h-[48px] text-gray-300">search_off</mat-icon>
              <p>No se encontraron productos para <strong>"{{ busqueda() }}"</strong></p>
            </div>
          }
        </div>
      </section>

      <!-- ════════ PANEL DE ORDEN (Derecha) ════════ -->
      <aside class="order-sheet">
        
        <!-- Sheet Header -->
        <div class="sheet-header">
          <h2 class="sheet-title">Orden Actual</h2>
          @if (carrito().length > 0) {
            <button class="clear-btn text-red-500" (click)="carrito.set([])" matTooltip="Vaciar toda la orden">
              Vaciar
            </button>
          }
        </div>

        <!-- Sheet Items -->
        <div class="sheet-items">
          @if (carrito().length === 0) {
            <div class="empty-cart">
              <div class="empty-cart-icon"><mat-icon class="!text-[32px] !w-[32px] !h-[32px]">shopping_bag</mat-icon></div>
              <p class="empty-cart-title">Tu orden está vacía</p>
              <p class="empty-cart-sub">Toca un producto para añadirlo.</p>
            </div>
          }

          <div class="items-list">
            @for (item of carrito(); track item.producto.id) {
              <div class="order-row">
                <div class="row-icon">{{ item.producto.emoji ?? '🍽️' }}</div>
                
                <div class="row-info">
                  <p class="row-name">{{ item.producto.nombre }}</p>
                  <p class="row-price">Bs. {{ item.producto.precio_base | number:'1.2-2' }}</p>
                </div>

                <div class="row-actions">
                  <div class="ios-stepper">
                    <button class="stepper-btn" (click)="sub(item.producto); $event.stopPropagation()">
                      <mat-icon class="!text-[18px]">remove</mat-icon>
                    </button>
                    <span class="stepper-val">{{ item.cantidad }}</span>
                    <button class="stepper-btn" (click)="add(item.producto); $event.stopPropagation()">
                      <mat-icon class="!text-[18px]">add</mat-icon>
                    </button>
                  </div>
                  <span class="row-subtotal">Bs. {{ item.subtotal | number:'1.0-0' }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Sheet Footer (Checkout) -->
        <div class="sheet-footer">
          <div class="totals">
            <span class="totals-label">Total a pagar</span>
            <span class="totals-val">Bs. {{ totalAPagar() | number:'1.2-2' }}</span>
          </div>

          <button class="apple-pay-btn" [class.apple-pay-btn--active]="carrito().length > 0"
                  [disabled]="carrito().length === 0" (click)="cobrar()">
            Cobrar Orden
          </button>
        </div>
      </aside>

      <!-- Ticket oculto para imprimir -->
      <app-ticket [ticketData]="ticketActual"></app-ticket>
    </div>
  `,
  styles: [`
    /* ── Tipografía y Reset ── */
    .apple-font {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :host { display: flex; height: 100%; width: 100%; overflow: hidden; }

    .pos-root { 
      display: flex; width: 100%; height: 100%; 
      background: transparent; /* Fondo proveniente de layout #F2F2F7 */
    }

    /* ════════ CATALOGO ════════ */
    .catalogue { display: flex; flex-direction: column; flex: 1; min-width: 0; overflow: hidden; }

    /* Header */
    .cat-header {
      flex-shrink: 0; padding: 24px 24px 16px;
      display: flex; flex-direction: column; gap: 16px;
      /* Opcional: Glassmorphism en scroll, pero dejémoslo limpio por ahora */
    }

    .header-top {
      display: flex; align-items: center; justify-content: space-between;
    }

    .page-title {
      font-size: 1.8rem; font-weight: 700; color: #000000; margin: 0; letter-spacing: -0.02em;
    }

    /* iOS Search Bar */
    .ios-search {
      display: flex; align-items: center; gap: 6px;
      width: 260px; height: 36px; padding: 0 10px;
      background: #E3E3E8; border-radius: 10px;
      transition: background 0.2s, box-shadow 0.2s;
    }
    .ios-search:focus-within { background: #FFFFFF; box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3); }
    .search-icon { color: #8E8E93; font-size: 18px !important; width: 18px !important; height: 18px !important; }
    .search-input { 
      flex: 1; border: none; background: transparent; outline: none; 
      font-size: 17px; color: #1C1C1E; font-family: inherit;
    }
    .search-input::placeholder { color: #8E8E93; }
    .search-clear {
      width: 18px; height: 18px; border-radius: 50%; background: #C7C7CC; color: #FFFFFF;
      border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
    }

    /* iOS Pills (Segmented style) */
    .cat-pills { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
    .cat-pills::-webkit-scrollbar { display: none; }
    .ios-pill {
      padding: 8px 16px; border-radius: 16px; border: none; cursor: pointer;
      background: #E5E5EA; color: #1C1C1E; font-size: 0.95rem; font-weight: 600;
      white-space: nowrap; flex-shrink: 0;
      transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
    }
    .ios-pill:active { transform: scale(0.96); }
    .ios-pill--active {
      background: #FFFFFF; color: #007AFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* ── Grid Productos ── */
    .prod-grid {
      flex: 1; overflow-y: auto; padding: 8px 24px 24px;
      display: grid; gap: 16px; align-content: start;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }

    /* Apple Squircles Cards */
    .apple-card {
      background: #FFFFFF; border-radius: 20px; overflow: hidden; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03); 
      display: flex; flex-direction: column;
      transform: translateZ(0); /* Hardware accel */
      transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s, border 0.2s;
      border: 2px solid transparent;
    }
    .apple-card:hover { transform: scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .apple-card:active { transform: scale(0.96); }
    
    .apple-card--in {
      border: 2px solid #007AFF; box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15);
    }

    .card-image-area {
      aspect-ratio: 4/3; background: #F8F9FA;
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .card-emoji { font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
    
    .card-details { padding: 12px 14px; text-align: center; }
    .card-title { margin: 0 0 4px; font-size: 0.9rem; font-weight: 600; color: #1C1C1E; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-price { margin: 0; font-size: 0.95rem; font-weight: 700; color: #8E8E93; }
    
    .apple-card--in .card-price { color: #007AFF; }

    /* iOS Notification Badge */
    .ios-badge {
      position: absolute; top: 10px; right: 10px;
      min-width: 26px; height: 26px; padding: 0 6px; border-radius: 13px;
      background: #FF3B30; color: #FFFFFF; font-size: 0.85rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(255, 59, 48, 0.4);
    }
    .bounce-in { animation: bouncy 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes bouncy {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }

    .empty-state {
      grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px 20px; color: #8E8E93; text-align: center; font-size: 1.1rem;
    }

    /* ════════ ORDER SHEET (Derecha) ════════ */
    .order-sheet {
      display: flex; flex-direction: column; flex-shrink: 0;
      background: #FFFFFF;
      width: 380px;
      box-shadow: -10px 0 30px rgba(0,0,0,0.03); /* Soft shadow separates from gray background */
      z-index: 10;
    }

    /* Sheet Header */
    .sheet-header {
      padding: 24px 24px 16px; flex-shrink: 0;
      display: flex; align-items: baseline; justify-content: space-between;
      border-bottom: 0.5px solid rgba(0,0,0,0.08);
    }
    .sheet-title { font-size: 1.5rem; font-weight: 800; color: #000000; margin: 0; letter-spacing: -0.02em; }
    .clear-btn { background: transparent; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; padding: 0; }
    .clear-btn:active { opacity: 0.5; }

    /* Items container */
    .sheet-items { flex: 1; overflow-y: auto; padding: 0 24px; }
    .sheet-items::-webkit-scrollbar { width: 4px; }
    .sheet-items::-webkit-scrollbar-thumb { background: #E5E5EA; border-radius: 4px; }

    .empty-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #8E8E93; text-align: center; }
    .empty-cart-icon { width: 80px; height: 80px; border-radius: 40px; background: #F2F2F7; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #C7C7CC; }
    .empty-cart-title { font-size: 1.2rem; font-weight: 700; color: #1C1C1E; margin: 0 0 4px; }
    .empty-cart-sub { font-size: 0.95rem; margin: 0; }

    .items-list { display: flex; flex-direction: column; }
    .order-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 0; border-bottom: 0.5px solid rgba(0,0,0,0.06);
    }
    .order-row:last-child { border-bottom: none; }
    
    .row-icon { font-size: 1.8rem; background: #F2F2F7; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px;}
    
    .row-info { flex: 1; min-width: 0; margin-right: 12px; }
    .row-name { margin: 0; font-size: 0.95rem; font-weight: 600; color: #1C1C1E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;}
    .row-price { margin: 4px 0 0; font-size: 0.85rem; color: #8E8E93; font-weight: 500;}

    .row-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .row-subtotal { font-weight: 700; color: #000000; font-size: 1rem; letter-spacing: -0.01em;}

    /* iOS Stepper (Pill with + and -) */
    .ios-stepper {
      display: flex; align-items: center; background: #F2F2F7; border-radius: 8px; padding: 2px;
    }
    .stepper-btn {
      width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent;
      display: flex; align-items: center; justify-content: center; color: #1C1C1E; cursor: pointer;
      transition: background 0.1s;
    }
    .stepper-btn:hover { background: #E5E5EA; }
    .stepper-btn:active { background: #D1D1D6; }
    .stepper-val { width: 24px; text-align: center; font-weight: 700; font-size: 0.9rem; color: #000000; }

    /* Footer / Checkout Button */
    .sheet-footer {
      padding: 20px 24px 24px;
      /* Soft shadow to pop above scroll */
      box-shadow: 0 -10px 20px rgba(0,0,0,0.02);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }
    .totals { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
    .totals-label { font-size: 1.1rem; font-weight: 600; color: #8E8E93; }
    .totals-val { font-size: 2rem; font-weight: 800; color: #000000; letter-spacing: -0.03em; line-height: 1;}

    /* Apple Pay style mega button */
    .apple-pay-btn {
      width: 100%; height: 56px; border-radius: 16px; border: none;
      font-size: 1.15rem; font-weight: 700; letter-spacing: 0.01em; cursor: pointer;
      background: #E5E5EA; color: #8E8E93; /* Disabled state */
      transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .apple-pay-btn--active {
      background: #007AFF; color: #FFFFFF;
      box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
    }
    .apple-pay-btn--active:active { transform: scale(0.96); opacity: 0.9; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2); }
  `]
})
export class VentaPosComponent implements OnInit {
  @ViewChild(TicketComponent) ticketRef!: TicketComponent;
  private dialog = inject(MatDialog);
  private cajaService = inject(CajaService);
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  productos  = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  catActiva  = signal<number>(0);
  carrito    = signal<ItemCarrito[]>([]);
  busqueda   = signal('');
  busquedaVal = '';

  ticketActual: TicketData = {
    fecha: '', hora: '', mesa: '', pedidoId: 0, items: [], total: 0, metodoPago: 'efectivo'
  };

  private contadorPedido = 1000;

  filtrados = computed(() => {
    let l = this.productos();
    if (this.catActiva() !== 0) l = l.filter(p => p.categoria_id === this.catActiva());
    const q = this.busqueda().toLowerCase().trim();
    if (q) l = l.filter(p => p.nombre.toLowerCase().includes(q));
    return l;
  });
  totalAPagar = computed(() => this.carrito().reduce((s, i) => s + i.subtotal, 0));
  totalItems  = computed(() => this.carrito().reduce((s, i) => s + i.cantidad, 0));
  cantCart = (id: number) => this.carrito().find(i => i.producto.id === id)?.cantidad ?? 0;

  ngOnInit() {
    this.categorias.set([
      { id: 1, nombre: 'Kjaras',  icon: 'local_restaurant' },
      { id: 2, nombre: 'Bebidas', icon: 'local_cafe'       },
      { id: 3, nombre: 'Extras',  icon: 'add'              },
    ]);
    this.productos.set([
      { id: 1, nombre: 'Kjara Especial Doña Migue', precio_base: 45, categoria_id: 1, emoji: '🥩' },
      { id: 2, nombre: 'Kjara Pequeña',             precio_base: 30, categoria_id: 1, emoji: '🍖' },
      { id: 3, nombre: 'Kjara con Mote y Chorizo',  precio_base: 55, categoria_id: 1, emoji: '🫕' },
      { id: 4, nombre: 'Porción de Mote',           precio_base: 10, categoria_id: 3, emoji: '🌽' },
      { id: 5, nombre: 'Chorizo Extra',             precio_base: 12, categoria_id: 3, emoji: '🌭' },
      { id: 6, nombre: 'Coca Quina 2L',             precio_base: 15, categoria_id: 2, emoji: '🥤' },
      { id: 7, nombre: 'Jarra Mocochinchi',         precio_base: 18, categoria_id: 2, emoji: '🍹' },
      { id: 8, nombre: 'Agua Mineral 600ml',        precio_base:  8, categoria_id: 2, emoji: '💧' },
    ]);
  }

  add(p: Producto) {
    if (!this.cajaService.cajaAbierta()) {
      this.dialog.open(CajaCerradaModalComponent, { width: '400px', maxWidth: '95vw', panelClass: 'apple-modal' });
      return;
    }
    this.carrito.update(it => {
      const i = it.findIndex(x => x.producto.id === p.id);
      if (i !== -1) { const a = [...it]; a[i] = { ...a[i], cantidad: a[i].cantidad+1, subtotal: (a[i].cantidad+1)*p.precio_base }; return a; }
      return [...it, { producto: p, cantidad: 1, subtotal: p.precio_base }];
    });
  }
  
  sub(p: Producto) {
    this.carrito.update(it => {
      const i = it.findIndex(x => x.producto.id === p.id); if (i===-1) return it;
      const a = [...it];
      if (a[i].cantidad > 1) { a[i] = { ...a[i], cantidad: a[i].cantidad-1, subtotal: (a[i].cantidad-1)*p.precio_base }; return a; }
      return it.filter(x => x.producto.id !== p.id);
    });
  }

  cobrar() {
    const ref = this.dialog.open(CobroModalComponent, {
      width: '480px', maxWidth: '95vw', disableClose: true, panelClass: 'apple-modal',
      data: { total: this.totalAPagar(), carrito: this.carrito() }
    });
    ref.afterClosed().subscribe(async r => { 
      if (r?.exito) {
        
        try {
          const sucursal_id = this.auth.userSucursal() || 1; // Fallback to 1
          const detalles = this.carrito().map(item => ({
            producto_id: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.producto.precio_base
          }));

          const pedidoSupa = await this.supabase.registrarPedido({
            total: this.totalAPagar(),
            metodo_pago: r.metodo,
            estado: 'pagado',
            sucursal_id: sucursal_id,
            detalles: detalles
          });

          const ahora = new Date();
          this.ticketActual = {
            fecha: ahora.toLocaleDateString('es-BO'),
            hora: ahora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
            mesa: r.cliente || 'Cliente General',
            pedidoId: pedidoSupa.id,
            items: this.carrito().map(item => ({
              cantidad: item.cantidad,
              nombre: item.producto.nombre,
              precioUnitario: item.producto.precio_base,
              subtotal: item.subtotal
            })),
            total: this.totalAPagar(),
            metodoPago: r.metodo,
            tipoOrden: r.tipoPedido === 'llevar' ? 'para_llevar' : 'mesa',
            montoEntregado: r.montoEntregado,
            cambio: r.cambio
          };

          this.ticketRef.imprimir();
          this.carrito.set([]); 
        } catch (error) {
          console.error('Error al registrar pedido', error);
          alert('Error al registrar pedido. Inténtalo de nuevo.');
        }
      }
    });
  }
}