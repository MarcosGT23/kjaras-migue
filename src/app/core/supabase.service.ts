// src/app/core/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  // Cliente admin público para que otros servicios puedan hacer writes sin RLS
  adminClient!: SupabaseClient;

  constructor() {
    const opts = {
      auth: {
        // Evita el conflicto entre zone.js y navigator.locks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: <R>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => fn()
      }
    };

    this.supabase = createClient(environment.supabase.url, environment.supabase.key, opts);

    // Cliente con permisos absolutos para escritura (dev local únicamente)
    this.adminClient = createClient(
      environment.supabase.url,
      environment.supabase.serviceRoleKey,
      {
        auth: {
          lock: <R>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => fn(),
          persistSession: false
        },
        global: {
          headers: { Authorization: `Bearer ${environment.supabase.serviceRoleKey}` }
        }
      }
    );
  }

  // Getter para usar el cliente de lectura en componentes
  get client(): SupabaseClient {
    return this.supabase;
  }

  async getCategorias() {
    const { data, error } = await this.client
      .from('categorias')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async getProductos() {
    const { data, error } = await this.client
      .from('productos')
      .select(`
        id, 
        nombre, 
        precio_base, 
        categoria_id,
        activo, 
        categorias (id, nombre),
        inventario (stock_actual)
      `)
      .eq('activo', true)
      .order('id', { ascending: false });

    if (error) throw error;
    return data;
  }

  // 3. Crear un Producto y su Inventario inicial
  async crearProducto(producto: any, stockInicial: number) {
    // A. Insertamos el producto
    const { data: nuevoProd, error: errProd } = await this.client
      .from('productos')
      .insert({
        nombre: producto.nombre,
        precio_base: producto.precio_base,
        categoria_id: producto.categoria_id,
        activo: producto.activo
      })
      .select()
      .single();

    if (errProd) throw errProd;

    // B. Le creamos su stock inicial en la sucursal 1 (Sucursal Central)
    const { error: errInv } = await this.client
      .from('inventario')
      .insert({
        producto_id: nuevoProd.id,
        sucursal_id: 1, // Atado a la sucursal matriz por ahora
        stock_actual: stockInicial
      });

    if (errInv) throw errInv;
    return nuevoProd;
  }

  // 3. ACTUALIZAR: Modificar precio, nombre o estado
  async actualizarProducto(id: number, cambios: any) {
    const { data, error } = await this.client
      .from('productos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Crear una nueva categoría
  async crearCategoria(categoria: { nombre: string; descripcion?: string; orden?: number }) {
    const { data, error } = await this.client
      .from('categorias')
      .insert(categoria)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 4. ELIMINAR: Borrar un producto (Solo si no tiene ventas asociadas)
  async eliminarProducto(id: number) {
    const { error } = await this.client
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // ==========================================
  // GESTIÓN DE PERSONAL Y SUCURSALES (Admin)
  // ==========================================

  // Obtener todas las sucursales
  async getSucursales() {
    const { data, error } = await this.client
      .from('sucursales')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Obtener todos los usuarios (Con JOIN para traer el nombre de su sucursal)
  async getUsuariosAdmin() {
    const { data, error } = await this.client
      .from('usuarios')
      .select(`
        id,
        nombre_completo,
        rol,
        activo,
        sucursal_id,
        sucursales (nombre)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Bloquear o Desbloquear el acceso a un usuario
  async actualizarEstadoUsuario(id: string, activo: boolean) {
    const { error } = await this.client
      .from('usuarios')
      .update({ activo })
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // CREACIÓN SEGURA DE USUARIOS (Vía Edge Function)
  // ==========================================

  async registrarNuevoEmpleado(datosUsuario: any) {
    const emailInterno = `${datosUsuario.username}@kjaras.local`;

    const { data, error } = await this.client.functions.invoke('crear-usuario', {
      body: {
        email: emailInterno,
        password: datosUsuario.password,
        nombre_completo: datosUsuario.nombre_completo,
        rol: datosUsuario.rol,
        sucursal_id: datosUsuario.sucursal_id
      }
    });

    if (error) throw new Error(error.message || 'Error al invocar la función.');
    return data;
  }

  // ==========================================
  // ACTUALIZAR USUARIO (Perfil Público)
  // ==========================================

  async actualizarEmpleado(id: string, datos: any) {
    const { data, error } = await this.client
      .from('usuarios')
      .update({
        nombre_completo: datos.nombre_completo,
        rol: datos.rol,
        sucursal_id: datos.sucursal_id,
        activo: datos.activo
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================================
  // CREAR Y ACTUALIZAR SUCURSALES
  // ==========================================

  async crearSucursal(datos: any) {
    const { data, error } = await this.client
      .from('sucursales')
      .insert({
        nombre: datos.nombre,
        direccion: datos.direccion,
        telefono: datos.telefono,
        activa: datos.activa
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async actualizarSucursal(id: number, datos: any) {
    const { data, error } = await this.client
      .from('sucursales')
      .update({
        nombre: datos.nombre,
        direccion: datos.direccion,
        telefono: datos.telefono,
        activa: datos.activa
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================================
  // MONITOREO EN TIEMPO REAL (WebSockets)
  // ==========================================

  escucharVentasEnVivo(callback: (nuevoPedido: any) => void) {
    const channel = this.client
      .channel('radar-ventas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => { callback(payload.new); }
      )
      .subscribe();
    return channel;
  }

  // ==========================================
  // HISTORIAL DE VENTAS (Admin)
  // ==========================================

  /**
   * Trae el historial de pedidos con JOIN a sucursales y detalle.
   * Si se pasa sucursalId, filtra solo esa sucursal.
   */
  async getPedidos(sucursalId?: number, limite: number = 100) {
    let query = this.client
      .from('pedidos')
      .select(`
        id,
        created_at,
        total,
        estado,
        cliente_nombre,
        numero_mesa,
        apertura_cajas (
          sucursal_id,
          sucursales (id, nombre)
        ),
        pagos (metodo),
        detalle_pedidos (
          cantidad,
          precio_unitario,
          subtotal,
          productos (nombre)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (sucursalId !== undefined) {
      query = query.eq('apertura_cajas.sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Trae KPIs de ventas agrupados por sucursal para el día de hoy.
   */
  async getResumenVentasPorSucursal() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { data, error } = await this.client
      .from('pedidos')
      .select(`
        total,
        apertura_cajas (
          sucursal_id,
          sucursales (id, nombre, activa)
        )
      `)
      .gte('created_at', hoy.toISOString());

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Canal Realtime global para la página de ventas (separate channel name).
   */
  escucharPedidosGlobal(callback: (pedido: any) => void) {
    const channel = this.client
      .channel('admin-ventas-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => { callback(payload.new); }
      )
      .subscribe();
    return channel;
  }

  // ==========================================
  // REGISTRAR VENTA (Cajero)
  // ==========================================

  async registrarPedido(datosPedido: {
    total: number;
    metodo_pago: string;
    estado: string;
    sucursal_id: number;
    cliente?: string;
    tipo_pedido?: string;
    detalles: { producto_id: number; cantidad: number; precio_unitario: number }[];
  }) {
    // 0. Obtener la caja abierta para la sucursal
    const { data: apertura } = await this.adminClient
      .from('apertura_cajas')
      .select('id')
      .eq('sucursal_id', datosPedido.sucursal_id)
      .eq('estado', 'abierta')
      .single();

    if (!apertura) {
      throw new Error("No hay una caja abierta para esta sucursal. Abre caja primero.");
    }

    // 1. Insertar el pedido principal
    const { data: pedidoNuevo, error: errPedido } = await this.adminClient
      .from('pedidos')
      .insert({
        total: datosPedido.total,
        estado: datosPedido.estado,
        apertura_caja_id: apertura.id,
        cliente_nombre: datosPedido.cliente || null,
        numero_mesa: datosPedido.tipo_pedido === 'llevar' ? null : 1
      })
      .select()
      .single();

    if (errPedido || !pedidoNuevo) throw errPedido || new Error("Error al crear pedido");

    // 2. Insertar el pago
    const { error: errPago } = await this.adminClient
      .from('pagos')
      .insert({
        pedido_id: pedidoNuevo.id,
        metodo: datosPedido.metodo_pago,
        monto: datosPedido.total
      });

    if (errPago) throw errPago;

    // 3. Insertar el detalle
    const detallesAInsertar = datosPedido.detalles.map(d => ({
      pedido_id: pedidoNuevo.id,
      producto_id: d.producto_id,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario
      // subtotal es columna generada por la DB (no se inserta manualmente)
    }));

    const { error: errDetalle } = await this.adminClient
      .from('detalle_pedidos')
      .insert(detallesAInsertar);

    if (errDetalle) throw errDetalle;
    
    return pedidoNuevo;
  }

  async anularPedido(id: number) {
    const { error } = await this.adminClient
      .from('pedidos')
      .update({ estado: 'anulado' })
      .eq('id', id);
    if (error) throw error;
  }
}