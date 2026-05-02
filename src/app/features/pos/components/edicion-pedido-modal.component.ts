import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Categoria { id: number; nombre: string; icon: string; }
interface Producto { id: number; nombre: string; precio_base: number; categoria_id: number; emoji?: string; }
interface LineaItem { producto_id: number; nombre: string; cantidad: number; precio_unitario: number; subtotal: number; }
interface Pedido { id: number; created_at: string; total: number; metodo_pago: string; estado: string; cliente?: string; tipo_pedido?: 'mesa'|'llevar'; items: LineaItem[]; expanded?: boolean; }

@Component({
  selector: 'app-edicion-pedido-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe, MatDialogModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="apple-font ios-modal">
      
      <!-- Topbar Blur Header -->
      <div class="modal-header">
        <div class="header-titles">
          <h2 class="modal-title">Editar Orden #{{ data.pedido.id }}</h2>
          <p class="modal-sub">Añade nuevos productos o ajusta el carrito actual.</p>
        </div>
        <button class="close-btn" mat-dialog-close [disabled]="loading()">
          <mat-icon class="!text-[22px]">close</mat-icon>
        </button>
      </div>

      <!-- Main Layout: Grid / Split -->
      <div class="modal-body">
        
        <!-- Left Pane: Catalog -->
        <div class="modal-catalog">
          <!-- Segmented Filter -->
          <div class="ios-segmented">
            <button class="seg-btn" [class.seg-btn--active]="catActiva() === 0" (click)="catActiva.set(0)">
              Todos
            </button>
            @for (c of categorias(); track c.id) {
              <button class="seg-btn" [class.seg-btn--active]="catActiva() === c.id" (click)="catActiva.set(c.id)">
                {{ c.nombre }}
              </button>
            }
          </div>

          <div class="grid-productos scroll-hidden">
            @for (p of productosFiltrados(); track p.id) {
              <div class="prod-card" (click)="agregarProducto(p)">
                <div class="prod-emoji">{{ p.emoji || '🍽️' }}</div>
                <div class="prod-info">
                  <span class="prod-name">{{ p.nombre }}</span>
                  <span class="prod-price">Bs. {{ p.precio_base }}</span>
                </div>
                <!-- Mini Add Badge -->
                <button class="prod-add">
                  <mat-icon class="!text-[16px]">add</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Right Pane: Cart Edit -->
        <div class="modal-cart">
          <div class="cart-header">
            <h3>CARRITO DE EDICIÓN</h3>
          </div>
          
          <div class="cart-list scroll-hidden">
            @if (carrito().length === 0) {
              <div class="empty-state">
                <mat-icon class="!text-[40px] !w-[40px] !h-[40px] mb-3 text-slate-300">shopping_cart</mat-icon>
                <p>El pedido quedará vacío.<br>Puedes añadir productos.</p>
              </div>
            }
            @for (item of carrito(); track item.nombre) {
              <div class="cart-item">
                <div class="ci-details">
                  <span class="ci-name">{{ item.nombre }}</span>
                  <span class="ci-price">Bs. {{ item.precio_unitario | number:'1.2-2' }}</span>
                </div>
                
                <div class="ci-controls">
                  <!-- Stepper iOS -->
                  <div class="ios-stepper">
                    <button class="step-btn" (click)="restar(item)"><mat-icon class="!text-[16px]">remove</mat-icon></button>
                    <span class="step-val">{{ item.cantidad }}</span>
                    <button class="step-btn" (click)="sumar(item)"><mat-icon class="!text-[16px]">add</mat-icon></button>
                  </div>
                  <span class="ci-subtotal">Bs. {{ item.subtotal | number:'1.2-2' }}</span>
                </div>
              </div>
            }
          </div>

          <div class="cart-totals">
            <div class="tot-row mb-1">
              <span class="tot-lbl text-slate-400">Total Previo</span>
              <span class="tot-val text-slate-400 line-through">Bs. {{ data.pedido.total | number:'1.2-2' }}</span>
            </div>
            <div class="tot-row main-total">
              <span class="tot-lbl text-black font-bold">Nuevo Total</span>
              <span class="tot-val text-blue-600 !font-black !text-2xl">Bs. {{ nuevoTotal() | number:'1.2-2' }}</span>
            </div>
            <!-- Diff alert if not equal -->
            @if (diferencia() !== 0) {
              <div class="diff-chip" [class.diff-chip--pos]="diferencia() > 0">
                <mat-icon class="!text-[14px]">{{ diferencia() > 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                <span>Diferencia de Bs. {{ (diferencia() > 0 ? diferencia() : -diferencia()) | number:'1.2-2' }}</span>
              </div>
            }
          </div>
          
          <button class="apple-pay-btn" [class.apple-pay-btn--active]="carrito().length > 0" 
                  [disabled]="loading() || carrito().length === 0" (click)="guardar()">
            @if (loading()) { <mat-spinner diameter="20" color="accent"></mat-spinner> }
            @else { <span>Confirmar Cambios</span> }
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .apple-font {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .scroll-hidden::-webkit-scrollbar { width: 4px; }
    .scroll-hidden::-webkit-scrollbar-thumb { background: #E5E5EA; border-radius: 4px; }

    .ios-modal {
      display: flex; flex-direction: column; width: 100%; height: 75vh; min-height: 550px;
      background: #F2F2F7; overflow: hidden;
    }

    /* Blur Header */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 32px 16px; background: rgba(242, 242, 247, 0.85);
      backdrop-filter: blur(20px); border-bottom: 0.5px solid rgba(0,0,0,0.06);
      z-index: 10;
    }
    .header-titles { display: flex; flex-direction: column; }
    .modal-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #000000; letter-spacing: -0.02em; }
    .modal-sub   { margin: 4px 0 0; font-size: 0.95rem; color: #8E8E93; }
    
    .close-btn {
      width: 36px; height: 36px; border-radius: 18px; background: #E5E5EA; color: #8E8E93;
      display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s;
    }
    .close-btn:hover { background: #D1D1D6; color: #1C1C1E; }

    /* Body Flex */
    .modal-body {
      flex: 1; display: flex; overflow: hidden; padding: 20px 32px 32px; gap: 24px;
    }

    /* Left - Catalog */
    .modal-catalog {
      flex: 1.2; display: flex; flex-direction: column; gap: 16px; overflow: hidden;
    }
    
    .ios-segmented {
      display: flex; background: #E5E5EA; border-radius: 10px; padding: 3px; gap: 2px; flex-shrink: 0;
    }
    .seg-btn {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 10px 0; border: none; border-radius: 8px; background: transparent;
      font-size: 0.9rem; font-weight: 600; color: #8E8E93; cursor: pointer; transition: all 0.2s;
    }
    .seg-btn--active { background: #FFFFFF; color: #000000; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

    .grid-productos {
      flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
      gap: 16px; overflow-y: auto; padding-bottom: 20px; align-content: flex-start;
    }
    
    .prod-card {
      background: #FFFFFF; border-radius: 20px; padding: 16px; cursor: pointer; position: relative;
      display: flex; flex-direction: column; align-items: flex-start;
      box-shadow: 0 4px 16px rgba(0,0,0,0.02); border: 1.5px solid transparent;
      transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .prod-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: rgba(0, 122, 255, 0.1); }
    .prod-card:active { transform: scale(0.96); }

    .prod-emoji { font-size: 2.2rem; margin-bottom: 12px; }
    .prod-info { display: flex; flex-direction: column; width: 100%; }
    .prod-name { font-size: 0.9rem; font-weight: 600; color: #1C1C1E; line-height: 1.2; margin-bottom: 6px;}
    .prod-price { font-size: 0.9rem; font-weight: 700; color: #007AFF; }
    .prod-add {
      position: absolute; right: 12px; bottom: 12px; width: 28px; height: 28px;
      border-radius: 14px; background: #F2F2F7; color: #007AFF; border: none;
      display: flex; align-items: center; justify-content: center; pointer-events: none;
    }

    /* Right - Cart */
    .modal-cart {
      flex: 1; background: #FFFFFF; border-radius: 24px; display: flex; flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.04); padding: 24px; overflow: hidden;
    }
    .cart-header { padding-bottom: 16px; border-bottom: 0.5px solid #E5E5EA; flex-shrink: 0; }
    .cart-header h3 { margin: 0; font-size: 0.8rem; font-weight: 700; color: #8E8E93; letter-spacing: 0.05em; }

    .cart-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8E8E93; font-size: 0.95rem; text-align: center; }

    .cart-item {
      display: flex; flex-direction: column; gap: 12px; padding: 16px 0;
      border-bottom: 0.5px solid #E5E5EA;
    }
    .ci-details { display: flex; justify-content: space-between; align-items: flex-start; }
    .ci-name { font-size: 1.05rem; font-weight: 600; color: #1C1C1E; flex: 1; line-height: 1.2; }
    .ci-price { font-size: 0.9rem; color: #8E8E93; font-weight: 500; }

    .ci-controls { display: flex; justify-content: space-between; align-items: center; }
    
    .ios-stepper {
      display: flex; align-items: center; background: #F2F2F7; border-radius: 12px; padding: 4px;
    }
    .step-btn {
      width: 32px; height: 32px; border-radius: 10px; border: none; background: #FFFFFF;
      display: flex; align-items: center; justify-content: center; color: #000000; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: transform 0.1s;
    }
    .step-btn:active { transform: scale(0.9); }
    .step-val { width: 36px; text-align: center; font-weight: 700; font-size: 1rem; color: #000000; }
    
    .ci-subtotal { font-size: 1.15rem; font-weight: 800; color: #000000; }

    .cart-totals { padding: 20px 0; border-top: 0.5px solid #E5E5EA; }
    .tot-row { display: flex; justify-content: space-between; align-items: center; }
    .tot-lbl { font-size: 0.95rem; font-weight: 600;}
    .tot-val { font-size: 1rem; font-weight: 600; }

    .diff-chip {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700; margin-top: 8px;
      background: #FFE5E5; color: #FF3B30;
    }
    .diff-chip--pos { background: #E5F4EA; color: #34C759; }

    .apple-pay-btn {
      width: 100%; height: 56px; border-radius: 16px; border: none; flex-shrink: 0;
      font-size: 1.1rem; font-weight: 700; letter-spacing: 0.01em; cursor: pointer;
      background: #E5E5EA; color: #8E8E93; transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
      display: flex; align-items: center; justify-content: center;
    }
    .apple-pay-btn--active { background: #007AFF; color: #FFFFFF; box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3); }
    .apple-pay-btn--active:active { transform: scale(0.96); opacity: 0.9; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2); }

    /* Responsive */
    @media (max-width: 800px) {
      .modal-body { 
        flex-direction: column; 
        overflow-y: auto; 
        padding: 16px; 
      }
      .modal-catalog, .modal-cart {
        flex: none;
        overflow: visible;
      }
      .grid-productos, .cart-list {
        overflow: visible;
      }
      .ios-modal {
        height: 85vh;
        min-height: auto;
      }
      .modal-header {
        padding: 16px;
      }
    }
  `]
})
export class EdicionPedidoModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<EdicionPedidoModalComponent>);
  data      = inject(MAT_DIALOG_DATA) as { pedido: Pedido };
  
  carrito   = signal<LineaItem[]>([]);
  loading   = signal(false);

  // Mismos productos que en la venta principal. Idealmente de BD, pero mantenemos consistencia
  categorias = signal<Categoria[]>([
    { id: 1, nombre: 'Kjaras',  icon: 'local_restaurant' },
    { id: 2, nombre: 'Bebidas', icon: 'local_cafe'       },
    { id: 3, nombre: 'Extras',  icon: 'add'              },
  ]);
  productos = signal<Producto[]>([
    { id: 1, nombre: 'Kjara Especial Doña Migue', precio_base: 45, categoria_id: 1, emoji: '🥩' },
    { id: 2, nombre: 'Kjara Pequeña',             precio_base: 30, categoria_id: 1, emoji: '🍖' },
    { id: 3, nombre: 'Kjara con Mote y Chorizo',  precio_base: 55, categoria_id: 1, emoji: '🫕' },
    { id: 4, nombre: 'Porción de Mote',           precio_base: 10, categoria_id: 3, emoji: '🌽' },
    { id: 5, nombre: 'Chorizo Extra',             precio_base: 12, categoria_id: 3, emoji: '🌭' },
    { id: 6, nombre: 'Coca Quina 2L',             precio_base: 15, categoria_id: 2, emoji: '🥤' },
    { id: 7, nombre: 'Jarra Mocochinchi',         precio_base: 18, categoria_id: 2, emoji: '🍹' },
    { id: 8, nombre: 'Agua Mineral 600ml',        precio_base:  8, categoria_id: 2, emoji: '💧' },
  ]);

  catActiva  = signal<number>(0);

  productosFiltrados = computed(() => {
    let l = this.productos();
    if (this.catActiva() !== 0) l = l.filter(p => p.categoria_id === this.catActiva());
    return l;
  });

  nuevoTotal = computed(() => this.carrito().reduce((sum, item) => sum + item.subtotal, 0));
  diferencia = computed(() => this.nuevoTotal() - this.data.pedido.total);

  ngOnInit() {
    // Si data.pedido.items no tiene producto_id por ser mock, busco por nombre
    const itemsMigrados: LineaItem[] = this.data.pedido.items.map(i => {
      const p = this.productos().find(x => x.nombre === i.nombre);
      return { 
        producto_id: p?.id ?? 0, 
        nombre: i.nombre, 
        cantidad: i.cantidad, 
        precio_unitario: i.precio_unitario,
        subtotal: i.cantidad * i.precio_unitario
      };
    });
    this.carrito.set(itemsMigrados);
  }

  sumar(item: LineaItem) {
    this.carrito.update(list => list.map(i => 
      i.nombre === item.nombre ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario } : i
    ));
  }

  restar(item: LineaItem) {
    this.carrito.update(list => {
      const idx = list.findIndex(x => x.nombre === item.nombre);
      if (idx === -1) return list;
      const arr = [...list];
      if (arr[idx].cantidad > 1) {
        arr[idx] = { ...arr[idx], cantidad: arr[idx].cantidad - 1, subtotal: (arr[idx].cantidad - 1) * arr[idx].precio_unitario };
        return arr;
      }
      return list.filter(i => i.nombre !== item.nombre);
    });
  }

  agregarProducto(prod: Producto) {
    this.carrito.update(list => {
      const existing = list.find(i => i.nombre === prod.nombre);
      if (existing) {
        return list.map(i => i.nombre === prod.nombre 
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario } 
          : i);
      } else {
        return [...list, { 
          producto_id: prod.id, nombre: prod.nombre, 
          cantidad: 1, precio_unitario: prod.precio_base, subtotal: prod.precio_base 
        }];
      }
    });
  }

  async guardar() {
    this.loading.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      this.dialogRef.close({ 
        exito: true, 
        items: this.carrito(), 
        nuevoTotal: this.nuevoTotal() 
      });
    } catch {
    } finally {
      this.loading.set(false);
    }
  }
}
