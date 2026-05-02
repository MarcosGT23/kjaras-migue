import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/supabase.service';

// Angular Material 3 Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductoModalComponent } from '../components/producto-modal.component';
import { CategoriaModalComponent } from '../components/categoria-modal.component';

// Interfaz del Producto para la tabla
interface ProductoAdmin {
  id: number;
  nombre: string;
  categoria: string;
  precio_base: number;
  stock_sucursal: number;
  activo: boolean;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  template: `
    <div class="p-4 md:p-8 bg-[#13131A] min-h-screen text-slate-200 font-sans tracking-wide">
      <div class="max-w-[1400px] mx-auto flex flex-col gap-6">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <mat-icon class="text-amber-400 scale-75">inventory_2</mat-icon>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-white m-0 tracking-tight">Menú e Inventario</h1>
              <p class="text-xs text-slate-500 m-0 mt-0.5">Gestiona platos, categorías y disponibilidad</p>
            </div>
          </div>

          <div class="header-actions">
            <button class="dark-btn-outline" (click)="abrirModalNuevaCategoria()">
              <mat-icon class="scale-75">category</mat-icon>
              Nueva Categoría
            </button>
            <button class="dark-btn-primary" (click)="abrirModalNuevoProducto()">
              <mat-icon class="scale-75">add</mat-icon>
              Nuevo Producto
            </button>
          </div>
        </div>

        <!-- Tabla card -->
        <div class="dark-card overflow-hidden">

          <!-- Buscador -->
          <div class="p-4 border-b border-[#2D2D3D] flex items-center gap-3">
            <mat-icon class="text-slate-500">search</mat-icon>
            <input
              #input
              class="bg-transparent outline-none border-none text-slate-300 placeholder-slate-600 text-sm w-full"
              placeholder="Buscar por nombre o categoría…"
              (keyup)="aplicarFiltro($event)"
            />
            @if (input.value) {
              <button class="text-slate-500 hover:text-slate-300 transition-colors" (click)="input.value=''; dataSource.filter=''">
                <mat-icon class="scale-75">close</mat-icon>
              </button>
            }
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="table-dark text-left border-collapse" [dataSource]="dataSource" mat-table>

              <!-- Nombre -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef class="th-dark">PRODUCTO</th>
                <td mat-cell *matCellDef="let prod" class="td-dark font-semibold text-white">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#1A1A24] border border-[#2D2D3D] flex items-center justify-center flex-shrink-0">
                      <mat-icon class="scale-[0.6] text-amber-400">restaurant</mat-icon>
                    </div>
                    {{ prod.nombre }}
                  </div>
                </td>
              </ng-container>

              <!-- Categoría -->
              <ng-container matColumnDef="categoria">
                <th mat-header-cell *matHeaderCellDef class="th-dark">CATEGORÍA</th>
                <td mat-cell *matCellDef="let prod" class="td-dark text-slate-400">
                  <div class="flex items-center gap-1.5">
                    @if (prod.categoria === 'Kjaras')  { <mat-icon class="scale-[0.6] text-amber-500">restaurant</mat-icon> }
                    @if (prod.categoria === 'Bebidas') { <mat-icon class="scale-[0.6] text-indigo-400">local_drink</mat-icon> }
                    @if (prod.categoria === 'Extras')  { <mat-icon class="scale-[0.6] text-emerald-400">tapas</mat-icon> }
                    {{ prod.categoria }}
                  </div>
                </td>
              </ng-container>

              <!-- Precio -->
              <ng-container matColumnDef="precio">
                <th mat-header-cell *matHeaderCellDef class="th-dark text-right">PRECIO BASE</th>
                <td mat-cell *matCellDef="let prod" class="td-dark text-right font-bold text-white">
                  Bs. {{ prod.precio_base.toFixed(2) }}
                </td>
              </ng-container>

              <!-- Stock -->
              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef class="th-dark text-center">STOCK</th>
                <td mat-cell *matCellDef="let prod" class="td-dark text-center">
                  @if (prod.stock_sucursal > 10) {
                    <span class="badge-dark badge-emerald">{{ prod.stock_sucursal }} uds.</span>
                  } @else if (prod.stock_sucursal > 0) {
                    <span class="badge-dark badge-amber">{{ prod.stock_sucursal }} uds.</span>
                  } @else {
                    <span class="badge-dark badge-red">Agotado</span>
                  }
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef class="th-dark text-center">ESTADO</th>
                <td mat-cell *matCellDef="let prod" class="td-dark text-center">
                  <button
                    class="estado-chip"
                    [class.estado-active]="prod.activo"
                    [class.estado-inactive]="!prod.activo"
                    (click)="toggleEstado(prod)"
                    [matTooltip]="'Clic para ' + (prod.activo ? 'ocultar' : 'activar')">
                    <span class="estado-dot"></span>
                    {{ prod.activo ? 'En Menú' : 'Oculto' }}
                  </button>
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="th-dark text-center">ACCIONES</th>
                <td mat-cell *matCellDef="let prod" class="td-dark text-center">
                  <button class="action-icon-btn" matTooltip="Editar Producto" (click)="editarProducto(prod)">
                    <mat-icon class="scale-75">edit</mat-icon>
                  </button>
                  <button class="action-icon-btn action-icon-btn--danger" matTooltip="Eliminar" (click)="eliminarProducto(prod.id)">
                    <mat-icon class="scale-75">delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasTabla"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasTabla;" class="table-row-dark group"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td colspan="6" class="py-16 text-center text-slate-600">
                  <mat-icon class="opacity-30 mb-2 text-4xl block mx-auto">search_off</mat-icon>
                  <p class="text-sm">Sin resultados para "{{ input.value }}"</p>
                </td>
              </tr>
            </table>

            <div class="border-t border-[#2D2D3D]">
              <mat-paginator
                [pageSizeOptions]="[5, 10, 25]"
                aria-label="Seleccionar página"
                class="dark-paginator">
              </mat-paginator>
            </div>
          </div>

        </div><!-- /dark-card -->
      </div>
    </div>
  `,
  styles: [`
    /* ─── Dark Card base ─────────────────────────── */
    .dark-card {
      background: #1C1C24;
      border: 1px solid #2D2D3D;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.25);
    }

    /* ─── Buttons ─────────────────────────────────── */
    .dark-btn-primary {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 8px 18px; border-radius: 12px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: .85rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(99,102,241,.25);
      transition: opacity .15s, transform .15s;
    }
    .dark-btn-primary:hover { opacity: .9; transform: translateY(-1px); }

    .dark-btn-outline {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 8px 18px; border-radius: 12px; cursor: pointer;
      background: transparent; border: 1px solid #2D2D3D;
      color: #94a3b8; font-size: .85rem; font-weight: 600;
      transition: border-color .15s, color .15s, background .15s;
    }
    .dark-btn-outline:hover { border-color: #6366f1; color: #818cf8; background: rgba(99,102,241,.06); }

    /* ─── Table ───────────────────────────────────── */
    .mat-mdc-table { background: transparent !important; }

    .th-dark {
      background: #13131A !important;
      color: #475569 !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      letter-spacing: .1em !important;
      border-bottom: 1px solid #2D2D3D !important;
      padding: 12px 16px !important;
    }

    .td-dark {
      border-bottom: 1px solid rgba(45,45,61,.5) !important;
      padding: 14px 16px !important;
      color: #94a3b8;
      font-size: .875rem;
    }

    .table-row-dark { transition: background .15s; }
    .table-row-dark:hover { background: rgba(26,26,36,.6) !important; }

    /* ─── Badges ──────────────────────────────────── */
    .badge-dark {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 8px;
      font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
    }
    .badge-emerald { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.2); }
    .badge-amber   { background: rgba(245,158,11,.12); color: #fbbf24; border: 1px solid rgba(245,158,11,.2); }
    .badge-red     { background: rgba(239,68,68,.12);  color: #f87171; border: 1px solid rgba(239,68,68,.2);  }

    /* ─── Estado chip ─────────────────────────────── */
    .estado-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 8px; border: none; cursor: pointer;
      font-size: .72rem; font-weight: 700; letter-spacing: .04em;
      transition: opacity .15s;
    }
    .estado-chip:hover { opacity: .8; }

    .estado-dot {
      width: 5px; height: 5px; border-radius: 50%;
    }
    .estado-active  { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.2); }
    .estado-active  .estado-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
    .estado-inactive { background: rgba(100,116,139,.1);  color: #64748b; border: 1px solid #2D2D3D; }
    .estado-inactive .estado-dot { background: #475569; }

    /* ─── Action buttons ──────────────────────────── */
    .action-icon-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      color: #64748b; transition: background .15s, color .15s;
    }
    .action-icon-btn:hover { background: rgba(99,102,241,.1); color: #818cf8; }
    .action-icon-btn--danger:hover { background: rgba(239,68,68,.1); color: #f87171; }

    /* ─── Paginator dark ──────────────────────────── */
    ::ng-deep .dark-paginator { background: transparent !important; }
    ::ng-deep .dark-paginator .mat-mdc-paginator-container { color: #64748b !important; }
    ::ng-deep .dark-paginator .mat-mdc-select-value { color: #94a3b8 !important; }
    ::ng-deep .dark-paginator .mat-mdc-icon-button { color: #64748b !important; }
    ::ng-deep .dark-paginator .mat-mdc-icon-button:hover { color: #e2e8f0 !important; }

    /* ─── Table min-width ─────────────────────────── */
    .table-dark { width: 100%; min-width: 560px; border-collapse: collapse; }

    /* ─── Mobile ──────────────────────────────────── */
    .header-actions {
      display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
    }
    @media (max-width: 480px) {
      .header-actions { flex-direction: column; width: 100%; }
      .header-actions button { width: 100%; justify-content: center; }
      .th-dark { padding: 10px 10px !important; font-size: 9px !important; }
      .td-dark  { padding: 11px 10px !important; font-size: .82rem; }
    }
  `]
})
export class InventarioComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private dialog   = inject(MatDialog);

  columnasTabla: string[] = ['nombre', 'categoria', 'precio', 'stock', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ProductoAdmin>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() { this.cargarDatosInventario(); }

  ngAfterViewInit() { this.dataSource.paginator = this.paginator; }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  abrirModalNuevaCategoria() {
    const ref = this.dialog.open(CategoriaModalComponent, {
      width: '480px',
      disableClose: true,
      panelClass: 'dark-theme-dialog',
      autoFocus: 'first-tabbable'
    });
    ref.afterClosed().subscribe(r => {
      if (r?.exito) alert(`¡Categoría "${r.categoria.nombre}" creada con éxito!`);
    });
  }

  abrirModalNuevoProducto() {
    const ref = this.dialog.open(ProductoModalComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'dark-theme-dialog'
    });
    ref.afterClosed().subscribe(r => { if (r?.exito) this.cargarDatosInventario(); });
  }

  editarProducto(producto: ProductoAdmin) {
    const ref = this.dialog.open(ProductoModalComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'dark-theme-dialog',
      data: { producto }
    });
    ref.afterClosed().subscribe(r => { if (r?.exito) this.cargarDatosInventario(); });
  }

  async toggleEstado(producto: ProductoAdmin) {
    const nuevoEstado = !producto.activo;
    try {
      await this.supabase.actualizarProducto(producto.id, { activo: nuevoEstado });
      producto.activo = nuevoEstado;
    } catch (error) {
      console.error('Error actualizando estado', error);
      alert('No se pudo cambiar el estado del producto.');
    }
  }

  async eliminarProducto(id: number) {
    if (confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        await this.supabase.eliminarProducto(id);
        this.dataSource.data = this.dataSource.data.filter(p => p.id !== id);
      } catch (error) {
        console.error('Error eliminando producto', error);
        alert('No se pudo eliminar el producto. Puede tener ventas asociadas.');
      }
    }
  }

  async cargarDatosInventario() {
    try {
      const datosReales = await this.supabase.getProductos();
      this.dataSource.data = datosReales.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categorias?.nombre || 'Sin categoría',
        precio_base: p.precio_base,
        stock_sucursal: p.inventario && p.inventario.length > 0 ? p.inventario[0].stock_actual : 0,
        activo: p.activo
      }));
    } catch (error) {
      console.error('Error cargando el menú real:', error);
      alert('Hubo un error al cargar los productos de la base de datos.');
    }
  }
}