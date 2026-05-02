import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type UserRole = 'admin' | 'cajero' | 'parrillero' |'cocinero'|null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  /** Señal global con el rol del usuario activo */
  userRole = signal<UserRole>(null);
  userSucursal = signal<number | null>(null);

  constructor() {
    this.restoreSession();

    this.supabase.client.auth.onAuthStateChange((_event: string, session: any) => {
      if (!session) {
        this.userRole.set(null);
      }
    });
  }

  // ── LOGIN ────────────────────────────────────────────────────────────────
  // Devuelve el rol para que el componente navegue
  async login(usuario: string, password: string): Promise<UserRole> {
    const emailInterno = `${usuario}@kjaras.local`;

    const { data: authData, error: authError } =
      await this.supabase.client.auth.signInWithPassword({
        email: emailInterno,
        password
      });

    if (authError) throw authError;

    const { data: userData, error: userError } = await this.supabase.client
      .from('usuarios')
      .select('rol, sucursal_id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError) throw userError;

    if (!userData) {
      await this.supabase.client.auth.signOut();
      throw new Error('USER_NOT_IN_TABLE');
    }

    const rol = userData.rol as UserRole;
    this.userRole.set(rol);
    this.userSucursal.set(userData.sucursal_id);
    return rol; // el componente usa esto para navegar
  }

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.userRole.set(null);
    this.userSucursal.set(null);
  }

  // ── SESIÓN ACTIVA ────────────────────────────────────────────────────────
  async getSession() {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session;
  }

  // ── PRIVADOS ─────────────────────────────────────────────────────────────
  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    if (!data.session) return;

    const { data: userData } = await this.supabase.client
      .from('usuarios')
      .select('rol, sucursal_id')
      .eq('id', data.session.user.id)
      .maybeSingle();

    if (userData) {
      this.userRole.set(userData.rol as UserRole);
      this.userSucursal.set(userData.sucursal_id);
    }
  }
}
