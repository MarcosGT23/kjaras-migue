import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dev-tools-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 md:p-8 bg-[#0F0F14] min-h-screen text-slate-200 font-sans">
      <div class="max-w-4xl mx-auto flex flex-col gap-6">

        <!-- HEADER -->
        <div class="flex items-center gap-4 bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
          <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span class="text-red-500 font-bold text-xl">!</span>
          </div>
          <div>
            <h1 class="text-lg font-bold text-red-400 m-0">Dev Tools: Reseteo de Contraseñas</h1>
            <p class="text-sm text-slate-400 m-0">Advertencia: Módulo exclusivo para desarrollo local.</p>
          </div>
        </div>

        <!-- CONFIGURACIÓN DE ACCESO -->
        <div class="bg-[#1C1C24] border border-[#2D2D3D] p-5 rounded-xl shadow-lg">
          <h2 class="text-white font-semibold mb-3">Configuración (Requiere Service Role Key)</h2>
          <p class="text-sm text-slate-400 mb-4">Para poder listar y resetear usuarios, debes pegar aquí tu <code>service_role</code> key (la normal de environment.ts no sirve para esto).</p>
          
          <div class="flex flex-col md:flex-row gap-3">
            <input 
              type="password" 
              [(ngModel)]="serviceRoleKey" 
              placeholder="Pega tu service_role key aquí..."
              class="flex-1 bg-[#13131A] border border-[#2D2D3D] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button 
              (click)="cargarUsuarios()"
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap">
              Cargar Usuarios
            </button>
          </div>
          @if (errorMsg()) {
            <div class="mt-3 text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
              {{ errorMsg() }}
            </div>
          }
        </div>

        <!-- LISTA DE USUARIOS -->
        @if (users().length > 0) {
          <div class="bg-[#1C1C24] border border-[#2D2D3D] p-5 rounded-xl shadow-lg">
            
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-white font-semibold">Usuarios Encontrados ({{ users().length }})</h2>
              
              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  [(ngModel)]="nuevaPassword" 
                  placeholder="Nueva contraseña"
                  class="bg-[#13131A] border border-[#2D2D3D] rounded-lg px-3 py-1.5 text-white text-sm w-36"
                />
                <button 
                  (click)="resetearTodos()"
                  class="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-red-500/20">
                  Resetear Todos
                </button>
              </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-[#2D2D3D]">
              <table class="w-full text-left text-sm">
                <thead class="bg-[#13131A] text-slate-400 border-b border-[#2D2D3D]">
                  <tr>
                    <th class="px-4 py-3 font-semibold">ID</th>
                    <th class="px-4 py-3 font-semibold">Email / Username</th>
                    <th class="px-4 py-3 font-semibold">Creado</th>
                    <th class="px-4 py-3 font-semibold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#2D2D3D]">
                  @for (u of users(); track u.id) {
                    <tr class="hover:bg-white/5 transition-colors">
                      <td class="px-4 py-3 text-slate-500 font-mono text-xs">{{ u.id | slice:0:8 }}...</td>
                      <td class="px-4 py-3 text-white font-medium">{{ u.email }}</td>
                      <td class="px-4 py-3 text-slate-400">{{ u.created_at | date:'shortDate' }}</td>
                      <td class="px-4 py-3 text-center">
                        <button 
                          (click)="resetearUsuario(u)"
                          class="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors">
                          Resetear a "{{ nuevaPassword() }}"
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

          </div>
        }

      </div>
    </div>
  `
})
export class DevToolsAuthComponent {
  serviceRoleKey = signal<string>('');
  nuevaPassword = signal<string>('Kjaras2026*');
  
  users = signal<any[]>([]);
  errorMsg = signal<string>('');
  
  private tempSupabase: SupabaseClient | null = null;

  async cargarUsuarios() {
    this.errorMsg.set('');
    if (!this.serviceRoleKey().trim()) {
      this.errorMsg.set('Por favor, ingresa la clave service_role.');
      return;
    }

    try {
      this.tempSupabase = createClient(environment.supabase.url, this.serviceRoleKey().trim(), {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { data, error } = await this.tempSupabase.auth.admin.listUsers();
      
      if (error) throw error;
      
      this.users.set(data.users || []);
    } catch (e: any) {
      this.errorMsg.set('Error al cargar usuarios. ¿Es correcta la Service Role Key? ' + e.message);
      this.users.set([]);
    }
  }

  async resetearUsuario(user: any) {
    if (!this.tempSupabase) return;
    
    try {
      const { error } = await this.tempSupabase.auth.admin.updateUserById(user.id, {
        password: this.nuevaPassword()
      });
      
      if (error) throw error;
      alert(`Contraseña de ${user.email} reseteada exitosamente.`);
    } catch (e: any) {
      alert(`Error al resetear: ${e.message}`);
    }
  }

  async resetearTodos() {
    if (!this.tempSupabase || this.users().length === 0) return;
    
    const confirmar = confirm(`¿Estás seguro de resetear la contraseña de TODOS los usuarios a "${this.nuevaPassword()}"?`);
    if (!confirmar) return;

    let successCount = 0;
    for (const user of this.users()) {
      const { error } = await this.tempSupabase.auth.admin.updateUserById(user.id, {
        password: this.nuevaPassword()
      });
      if (!error) successCount++;
    }

    alert(`Proceso finalizado. Se resetearon ${successCount} de ${this.users().length} usuarios.`);
  }
}
