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

  async getProductos(sucursalId?: number) {
    let query = this.client
      .from('productos')
      .select(`
        id,
        nombre,
        precio_base,
        categoria_id,
        activo,
        categorias (id, nombre),
        inventario (stock_actual, sucursal_id)
      `)
      .eq('activo', true)
      .order('id', { ascending: false });

    // Si se proporciona sucursalId, filtrar productos que tengan inventario en esa sucursal
    if (sucursalId !== undefined) {
      query = query.not('inventario.sucursal_id', 'is', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filtrar localmente por sucursal si se proporcionó
    if (sucursalId !== undefined && data) {
      return data.filter((p: any) => {
        if (!p.inventario || p.inventario.length === 0) return false;
        return p.inventario.some((inv: any) => inv.sucursal_id === sucursalId);
      });
    }

    return data;
  }

  // 3. Crear un Producto y su Inventario inicial
  async crearProducto(producto: any, stockInicial: number, sucursalId?: number) {
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

    // B. Le creamos su stock inicial en la sucursal especificada (o 1 por defecto)
    const sucursalIdFinal = sucursalId || 1;
    const { error: errInv } = await this.client
      .from('inventario')
      .insert({
        producto_id: nuevoProd.id,
        sucursal_id: sucursalIdFinal,
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

  escucharVentasEnVivo(callback: (payload: any) => void) {
    const channel = this.client
      .channel('radar-ventas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => { callback(payload); }
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
   * Si se pasa usuarioId, filtra solo ese empleado (vendedor).
   */
  async getPedidos(sucursalId?: number, usuarioId?: string, limite: number = 100) {
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
          sucursales (id, nombre),
          usuario_id
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

    const { data, error } = await query;
    if (error) throw error;

    // Filtrar localmente por sucursal y usuario (Supabase no soporta filtrar por relaciones anidadas)
    let filtered = data ?? [];
    if (sucursalId !== undefined) {
      filtered = filtered.filter((p: any) => {
        const apertura = Array.isArray(p.apertura_cajas) ? p.apertura_cajas[0] : p.apertura_cajas;
        return apertura?.sucursal_id === sucursalId;
      });
    }

    if (usuarioId !== undefined) {
      filtered = filtered.filter((p: any) => {
        const apertura = Array.isArray(p.apertura_cajas) ? p.apertura_cajas[0] : p.apertura_cajas;
        return apertura?.usuario_id === usuarioId;
      });
    }

    return filtered;
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

    // 4. Actualizar inventario (disminuir stock)
    for (const detalle of datosPedido.detalles) {
      const { data: inventario, error: errInv } = await this.adminClient
        .from('inventario')
        .select('id, stock_actual')
        .eq('producto_id', detalle.producto_id)
        .eq('sucursal_id', datosPedido.sucursal_id)
        .single();

      if (errInv) {
        console.error(`Error obteniendo inventario para producto ${detalle.producto_id}:`, errInv);
        continue;
      }

      if (!inventario) {
        console.warn(`No existe inventario para producto ${detalle.producto_id} en sucursal ${datosPedido.sucursal_id}`);
        continue;
      }

      const nuevoStock = Math.max(0, inventario.stock_actual - detalle.cantidad);

      const { error: errUpdate } = await this.adminClient
        .from('inventario')
        .update({ stock_actual: nuevoStock })
        .eq('id', inventario.id);

      if (errUpdate) {
        console.error(`Error actualizando inventario para producto ${detalle.producto_id}:`, errUpdate);
      }
    }

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