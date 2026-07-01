// src/app/core/caja.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface EstadoCaja {
  abierta: boolean;
  aperturaId: number | null;
  sucursalId: number | null;
  montoInicial: number | null;
  horaApertura: string | null;
}

const STORAGE_KEY = 'kjaras_caja_estado';

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private supabase = inject(SupabaseService);
  private auth     = inject(AuthService);

  // Estado reactivo accesible desde toda la app
  cajaAbierta  = signal<boolean>(false);
  aperturaId   = signal<number | null>(null);
  horaApertura = signal<string | null>(null);
  montoInicial = signal<number | null>(null);

  // ─────────────────────────────────────────
  // Inicialización: verifica si hay caja abierta
  // Llamar desde el App root o desde ngOnInit del layout
  // ─────────────────────────────────────────
  async init(sucursalId: number, usuarioId?: string) {
    // 1. Leer estado guardado localmente
    const cached = this.leerCache();

    // 2. Verificar contra Supabase que la caja sigue abierta
    try {
      let query = this.supabase.client
        .from('apertura_cajas')
        .select('id, monto_inicial, fecha_inicio')
        .eq('sucursal_id', sucursalId)
        .eq('estado', 'abierta');

      // Si se proporciona usuarioId, filtrar también por usuario
      if (usuarioId) {
        query = query.eq('usuario_id', usuarioId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (data) {
        // Caja abierta en DB → sincronizar estado
        this._setAbierta({
          abierta: true,
          aperturaId: data.id,
          sucursalId,
          montoInicial: data.monto_inicial,
          horaApertura: data.fecha_inicio
        });
      } else {
        // No hay caja abierta en DB → limpiar
        this._setCerrada();
      }
    } catch (e) {
      console.warn('[CajaService] Error verificando estado en DB, usando cache local:', e);
      if (cached) this._setAbierta(cached);
      else        this._setCerrada();
    }
  }

  // ─────────────────────────────────────────
  // Abrir caja (inserta en Supabase + guarda en cache)
  // ─────────────────────────────────────────
  async abrirCaja(sucursalId: number, montoInicial: number): Promise<void> {
    // Obtener el UUID del usuario autenticado para incluirlo en la apertura
    const session = await this.supabase.client.auth.getSession();
    const usuarioId = session.data.session?.user?.id ?? null;

    const { data, error } = await this.supabase.adminClient
      .from('apertura_cajas')
      .insert({
        sucursal_id: sucursalId,
        usuario_id: usuarioId,
        monto_inicial: montoInicial,
        estado: 'abierta'
      })
      .select('id, fecha_inicio')
      .single();

    if (error) throw error;

    this._setAbierta({
      abierta: true,
      aperturaId: data.id,
      sucursalId,
      montoInicial,
      horaApertura: data.fecha_inicio
    });
  }

  // ─────────────────────────────────────────
  // Cerrar caja (actualiza en Supabase + limpia cache)
  // ─────────────────────────────────────────
  async cerrarCaja(): Promise<void> {
    const id = this.aperturaId();
    if (id) {
      const { error } = await this.supabase.adminClient
        .from('apertura_cajas')
        .update({ estado: 'cerrada', fecha_fin: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }
    this._setCerrada();
  }

  // ─────────────────────────────────────────
  // Helpers privados
  // ─────────────────────────────────────────
  private _setAbierta(estado: EstadoCaja) {
    this.cajaAbierta.set(true);
    this.aperturaId.set(estado.aperturaId);
    this.horaApertura.set(estado.horaApertura);
    this.montoInicial.set(estado.montoInicial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }

  private _setCerrada() {
    this.cajaAbierta.set(false);
    this.aperturaId.set(null);
    this.horaApertura.set(null);
    this.montoInicial.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private leerCache(): EstadoCaja | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
