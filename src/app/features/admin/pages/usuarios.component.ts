import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/supabase.service';

// Angular Material 3 Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SucursalModalComponent } from '../components/sucursal-modal.component';
import { UsuarioModalComponent } from '../components/usuario-modal.component';

// Interfaces locales
interface UsuarioAdmin {
  id: string;
  nombre_completo: string;
  username: string;
  rol: string;
  sucursal_nombre: string;
  activo: boolean;
}

interface SucursalAdmin {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  activa: boolean;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="p-4 md:p-8 bg-[#13131A] min-h-screen text-slate-200 font-sans tracking-wide">
      <div class="max-w-[1400px] mx-auto flex flex-col gap-6">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <mat-icon class="text-violet-400 scale-75">manage_accounts</mat-icon>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-white m-0 tracking-tight">Personal y Sucursales</h1>
              <p class="text-xs text-slate-500 m-0 mt-0.5">Administra los accesos al sistema y los locales físicos</p>
            </div>
          </div>
        </div>

        <!-- Tabs (custom dark) -->
        <div class="dark-tabs mobile-tabs">
          <button class="tab-btn" [class.tab-btn--on]="tabActivo() === 'usuarios'" (click)="tabActivo.set('usuarios')">
            <mat-icon class="scale-75">people</mat-icon>
            Usuarios del Sistema
          </button>
          <button class="tab-btn" [class.tab-btn--on]="tabActivo() === 'sucursales'" (click)="tabActivo.set('sucursales')">
            <mat-icon class="scale-75">storefront</mat-icon>
            Sucursales
          </button>
        </div>

        <!-- ══ TAB: Usuarios ══ -->
        @if (tabActivo() === 'usuarios') {
          <div class="dark-card overflow-hidden">

            <div class="p-4 border-b border-[#2D2D3D] flex justify-between items-center">
              <span class="text-sm font-semibold text-slate-300">
                {{ usuarios().length }} usuarios registrados
              </span>
              <button class="dark-btn-primary" (click)="abrirModalUsuario()">
                <mat-icon class="scale-75">person_add</mat-icon>
                Nuevo Usuario
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="usuarios-table text-left border-collapse" [dataSource]="usuarios()" mat-table>

                <ng-container matColumnDef="nombre">
                  <th mat-header-cell *matHeaderCellDef class="th-dark">EMPLEADO</th>
                  <td mat-cell *matCellDef="let user" class="td-dark">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                        {{ getIniciales(user.nombre_completo) }}
                      </div>
                      <div>
                        <div class="text-white font-semibold text-sm">{{ user.nombre_completo }}</div>
                        <div class="text-slate-500 text-xs">&#64;{{ user.username }}</div>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="rol">
                  <th mat-header-cell *matHeaderCellDef class="th-dark text-center">ROL</th>
                  <td mat-cell *matCellDef="let user" class="td-dark text-center">
                    <span class="rol-badge" [class]="getRolClass(user.rol)">{{ user.rol }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="sucursal">
                  <th mat-header-cell *matHeaderCellDef class="th-dark">SUCURSAL</th>
                  <td mat-cell *matCellDef="let user" class="td-dark text-slate-400">
                    <div class="flex items-center gap-1.5">
                      <mat-icon class="scale-[0.6] text-slate-600">store</mat-icon>
                      {{ user.sucursal_nombre || 'Todas (Admin)' }}
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="estado">
                  <th mat-header-cell *matHeaderCellDef class="th-dark text-center">ACCESO</th>
                  <td mat-cell *matCellDef="let user" class="td-dark text-center">
                    <button
                      class="estado-chip"
                      [class.estado-active]="user.activo"
                      [class.estado-inactive]="!user.activo"
                      (click)="toggleEstadoUsuario(user)"
                      [matTooltip]="user.activo ? 'Clic para bloquear' : 'Clic para permitir'">
                      <span class="estado-dot"></span>
                      {{ user.activo ? 'Permitido' : 'Bloqueado' }}
                    </button>
                  </td>
                </ng-container>

                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef class="th-dark text-center">ACCIONES</th>
                  <td mat-cell *matCellDef="let user" class="td-dark text-center">
                    <button class="action-icon-btn" matTooltip="Editar Usuario" (click)="editarUsuario(user)">
                      <mat-icon class="scale-75">edit</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columnasUsuarios"></tr>
                <tr mat-row *matRowDef="let row; columns: columnasUsuarios;" class="table-row-dark"></tr>
              </table>
            </div>
          </div>
        }

        <!-- ══ TAB: Sucursales ══ -->
        @if (tabActivo() === 'sucursales') {
          <div class="flex justify-end">
            <button class="dark-btn-amber mobile-full" (click)="abrirModalSucursal()">
              <mat-icon class="scale-75">add_business</mat-icon>
              Nueva Sucursal
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (sucursal of sucursales(); track sucursal.id) {
              <div class="sucursal-card group">

                <!-- Card Header -->
                <div class="p-5 border-b border-[#2D2D3D] flex items-start gap-4">
                  <div class="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <mat-icon class="text-amber-400 scale-90">storefront</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold text-base m-0 truncate">{{ sucursal.nombre }}</h3>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span class="relative flex h-2 w-2">
                        @if (sucursal.activa) {
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        }
                        <span class="relative inline-flex rounded-full h-2 w-2"
                              [class.bg-emerald-500]="sucursal.activa"
                              [class.bg-red-500]="!sucursal.activa"></span>
                      </span>
                      <span class="text-xs font-semibold"
                            [class.text-emerald-400]="sucursal.activa"
                            [class.text-red-400]="!sucursal.activa">
                        {{ sucursal.activa ? 'Operativa' : 'Cerrada' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Card Body -->
                <div class="p-5 flex flex-col gap-3">
                  <div class="flex items-start gap-2.5 text-sm text-slate-400">
                    <mat-icon class="scale-75 text-slate-600 flex-shrink-0 -mt-0.5">location_on</mat-icon>
                    <span class="leading-snug">{{ sucursal.direccion || 'Sin dirección registrada' }}</span>
                  </div>
                  <div class="flex items-center gap-2.5 text-sm text-slate-400">
                    <mat-icon class="scale-75 text-slate-600 flex-shrink-0">phone</mat-icon>
                    <span>{{ sucursal.telefono || 'Sin teléfono' }}</span>
                  </div>

                  <div class="border-t border-[#2D2D3D] pt-3 mt-1">
                    <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Personal Asignado</span>
                    <div class="flex items-center gap-2">
                      @if (obtenerPersonalDeSucursal(sucursal.id).length > 0) {
                        <div class="flex -space-x-2">
                          @for (emp of obtenerPersonalDeSucursal(sucursal.id) | slice:0:4; track emp.id) {
                            <div class="w-7 h-7 rounded-full bg-indigo-500/20 border-2 border-[#1C1C24] flex items-center justify-center text-[10px] font-bold text-indigo-400"
                                 [matTooltip]="emp.nombre_completo + ' (' + emp.rol + ')'">
                              {{ getIniciales(emp.nombre_completo) }}
                            </div>
                          }
                        </div>
                        @if (obtenerPersonalDeSucursal(sucursal.id).length > 4) {
                          <span class="text-xs text-slate-500">+{{ obtenerPersonalDeSucursal(sucursal.id).length - 4 }}</span>
                        }
                      } @else {
                        <span class="text-xs text-slate-600 italic">Sin personal asignado</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Card Footer -->
                <div class="px-5 py-3 border-t border-[#2D2D3D] bg-[#13131A]/50 flex justify-end rounded-b-2xl">
                  <button class="dark-btn-ghost" (click)="editarSucursal(sucursal)">
                    <mat-icon class="scale-75">edit</mat-icon>
                    Editar Info
                  </button>
                </div>
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    /* ─── Tabs ───────────────────────────────────── */
    .dark-tabs {
      display: flex; gap: 4px;
      background: #1C1C24; border: 1px solid #2D2D3D;
      border-radius: 14px; padding: 4px;
      width: fit-content;
    }
    .tab-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 10px; border: none; cursor: pointer;
      background: transparent; color: #64748b;
      font-size: .85rem; font-weight: 600; transition: all .2s;
    }
    .tab-btn:hover { color: #e2e8f0; }
    .tab-btn--on { background: #2D2D3D; color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.3); }

    /* ─── Dark Card ──────────────────────────────── */
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
      box-shadow: 0 4px 14px rgba(99,102,241,.25); transition: opacity .15s;
    }
    .dark-btn-primary:hover { opacity: .9; }

    .dark-btn-amber {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 8px 18px; border-radius: 12px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white; font-size: .85rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(217,119,6,.2); transition: opacity .15s;
    }
    .dark-btn-amber:hover { opacity: .9; }

    .dark-btn-ghost {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 14px; border-radius: 10px; border: 1px solid #2D2D3D;
      background: transparent; color: #64748b; font-size: .8rem; font-weight: 600;
      cursor: pointer; transition: border-color .15s, color .15s;
    }
    .dark-btn-ghost:hover { border-color: #6366f1; color: #818cf8; }

    /* ─── Table ───────────────────────────────────── */
    .mat-mdc-table { background: transparent !important; }

    .th-dark {
      background: #13131A !important;
      color: #475569 !important;
      font-size: 10px !important; font-weight: 700 !important; letter-spacing: .1em !important;
      border-bottom: 1px solid #2D2D3D !important;
      padding: 12px 16px !important;
    }
    .td-dark {
      border-bottom: 1px solid rgba(45,45,61,.5) !important;
      padding: 14px 16px !important; color: #94a3b8; font-size: .875rem;
    }
    .table-row-dark { transition: background .15s; }
    .table-row-dark:hover { background: rgba(26,26,36,.6) !important; }

    /* ─── Rol badge ───────────────────────────────── */
    .rol-badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 8px;
      font-size: .68rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
    }
    .rol-admin      { background: rgba(139,92,246,.15); color: #a78bfa; border: 1px solid rgba(139,92,246,.25); }
    .rol-cajero     { background: rgba(99,102,241,.12); color: #818cf8; border: 1px solid rgba(99,102,241,.2);  }
    .rol-parrillero { background: rgba(245,158,11,.12); color: #fbbf24; border: 1px solid rgba(245,158,11,.2); }
    .rol-cocinero   { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.2); }

    /* ─── Estado chip ─────────────────────────────── */
    .estado-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 8px; border: none; cursor: pointer;
      font-size: .72rem; font-weight: 700; letter-spacing: .04em; transition: opacity .15s;
    }
    .estado-chip:hover { opacity: .75; }
    .estado-dot { width: 5px; height: 5px; border-radius: 50%; }
    .estado-active   { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.2); }
    .estado-active   .estado-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
    .estado-inactive { background: rgba(239,68,68,.1); color: #f87171; border: 1px solid rgba(239,68,68,.2); }
    .estado-inactive .estado-dot { background: #ef4444; }

    /* ─── Action buttons ──────────────────────────── */
    .action-icon-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      color: #64748b; transition: background .15s, color .15s;
    }
    .action-icon-btn:hover { background: rgba(99,102,241,.1); color: #818cf8; }

    /* ─── Sucursal card ───────────────────────────── */
    .sucursal-card {
      background: #1C1C24;
      border: 1px solid #2D2D3D;
      border-radius: 20px;
      overflow: hidden;
      transition: border-color .2s, box-shadow .2s;
    }
    .sucursal-card:hover {
      border-color: rgba(245,158,11,.3);
      box-shadow: 0 0 0 1px rgba(245,158,11,.1), 0 8px 32px rgba(0,0,0,.3);
    }
    /* ─── Mobile full-width tabs ──────────────────── */
    .mobile-tabs {
      width: 100%;
    }
    .mobile-tabs .tab-btn { flex: 1; justify-content: center; }
    .usuarios-table { width: 100%; min-width: 540px; }

    @media (max-width: 480px) {
      .mobile-full { width: 100%; justify-content: center; }
    }
  `]
})
export class UsuariosComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private dialog   = inject(MatDialog);

  tabActivo = signal<'usuarios' | 'sucursales'>('usuarios');

  columnasUsuarios: string[] = ['nombre', 'rol', 'sucursal', 'estado', 'acciones'];

  usuarios  = signal<any[]>([]);
  sucursales = signal<any[]>([]);

  ngOnInit() { this.cargarDatosReales(); }

  async cargarDatosReales() {
    try {
      const [datosSucursales, datosUsuarios] = await Promise.all([
        this.supabase.getSucursales(),
        this.supabase.getUsuariosAdmin()
      ]);

      this.sucursales.set(datosSucursales);

      this.usuarios.set(datosUsuarios.map((u: any) => ({
        id: u.id,
        nombre_completo: u.nombre_completo,
        username: u.usuario,
        rol: u.rol,
        activo: u.activo,
        sucursal_id: u.sucursal_id,
        sucursal_nombre: u.sucursales ? u.sucursales.nombre : 'Acceso Global'
      })));
    } catch (error) {
      console.error('Error al cargar datos de personal:', error);
    }
  }

  abrirModalUsuario() {
    this.dialog.open(UsuarioModalComponent, {
      width: '600px', disableClose: true,
      panelClass: 'dark-theme-dialog',
      data: { sucursales: this.sucursales() }
    }).afterClosed().subscribe(r => { if (r?.exito) this.cargarDatosReales(); });
  }

  abrirModalSucursal() {
    this.dialog.open(SucursalModalComponent, {
      width: '500px', disableClose: true,
      panelClass: 'dark-theme-dialog'
    }).afterClosed().subscribe(r => { if (r?.exito) this.cargarDatosReales(); });
  }

  editarSucursal(sucursalActual: any) {
    this.dialog.open(SucursalModalComponent, {
      width: '500px', disableClose: true,
      panelClass: 'dark-theme-dialog',
      data: { sucursal: sucursalActual }
    }).afterClosed().subscribe(r => { if (r?.exito) this.cargarDatosReales(); });
  }

  editarUsuario(usuarioActual: any) {
    this.dialog.open(UsuarioModalComponent, {
      width: '600px', disableClose: true,
      panelClass: 'dark-theme-dialog',
      data: { usuario: usuarioActual, sucursales: this.sucursales() }
    }).afterClosed().subscribe(r => { if (r?.exito) this.cargarDatosReales(); });
  }

  async toggleEstadoUsuario(usuario: any) {
    try {
      await this.supabase.actualizarEstadoUsuario(usuario.id, !usuario.activo);
      usuario.activo = !usuario.activo;
    } catch (error) {
      console.error('Error al cambiar el estado', error);
      alert('No se pudo cambiar el estado del usuario.');
    }
  }

  getRolClass(rol: string): string {
    return `rol-badge rol-${rol}`;
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const p = nombre.trim().split(' ');
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[1][0]).toUpperCase();
  }

  obtenerPersonalDeSucursal(id: number) {
    return this.usuarios().filter(u => u.sucursal_id === id && u.activo);
  }
}