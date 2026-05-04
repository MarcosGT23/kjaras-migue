const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://chtfqkriruyxvjxmmazl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PEGA_AQUI_TU_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Iniciando carga de datos de prueba...');

  if (SUPABASE_SERVICE_ROLE_KEY === 'PEGA_AQUI_TU_SERVICE_ROLE_KEY') {
    console.error('ERROR: Debes reemplazar "PEGA_AQUI_TU_SERVICE_ROLE_KEY" con tu Service Role Key real.');
    return;
  }

  try {
    // 1. Asegurar que haya al menos una sucursal
    let { data: sucursal } = await supabase.from('sucursales').select('*').eq('id', 1).single();
    if (!sucursal) {
      console.log('Creando Sucursal Matriz...');
      const { data: nuevaSucursal, error: errSuc } = await supabase.from('sucursales').insert({
        nombre: 'Sucursal Matriz',
        direccion: 'Calle Falsa 123',
        telefono: '77712345',
        activa: true
      }).select().single();
      if (errSuc) throw errSuc;
      sucursal = nuevaSucursal;
    }

    // 2. Crear Categorías (si no existen)
    const categoriasBase = [
      { id: 1, nombre: 'Kjaras', orden: 1 },
      { id: 2, nombre: 'Bebidas', orden: 2 },
      { id: 3, nombre: 'Extras', orden: 3 }
    ];
    
    console.log('Verificando categorías...');
    for (const cat of categoriasBase) {
      const { error } = await supabase.from('categorias').upsert(cat, { onConflict: 'id' });
      if (error) throw error;
    }

    // 3. Crear Productos de Prueba (upsert para no duplicar si ya existen)
    const productosBase = [
      { id: 1, nombre: 'Kjara Especial Doña Migue', precio_base: 45, categoria_id: 1, activo: true },
      { id: 2, nombre: 'Kjara Pequeña', precio_base: 30, categoria_id: 1, activo: true },
      { id: 3, nombre: 'Kjara con Mote y Chorizo', precio_base: 55, categoria_id: 1, activo: true },
      { id: 4, nombre: 'Porción de Mote', precio_base: 10, categoria_id: 3, activo: true },
      { id: 5, nombre: 'Chorizo Extra', precio_base: 12, categoria_id: 3, activo: true },
      { id: 6, nombre: 'Coca Quina 2L', precio_base: 15, categoria_id: 2, activo: true },
      { id: 7, nombre: 'Jarra Mocochinchi', precio_base: 18, categoria_id: 2, activo: true },
      { id: 8, nombre: 'Agua Mineral 600ml', precio_base: 8, categoria_id: 2, activo: true },
    ];

    console.log('Verificando productos e inventario...');
    for (const p of productosBase) {
      const { error: errProd } = await supabase.from('productos').upsert(p, { onConflict: 'id' });
      if (errProd) throw errProd;

      // Inventario de 100 unidades por defecto
      await supabase.from('inventario').upsert({
        producto_id: p.id,
        sucursal_id: sucursal.id,
        stock_actual: 100
      }, { onConflict: 'producto_id,sucursal_id' });
    }

    // 4. Asegurar que haya una apertura de caja para esta sucursal
    console.log('Verificando caja abierta...');
    let { data: apertura } = await supabase.from('apertura_cajas')
      .select('id')
      .eq('sucursal_id', sucursal.id)
      .eq('estado', 'abierta')
      .single();

    if (!apertura) {
      // Necesitamos un usuario para la caja, intentamos obtener el primero
      const { data: user } = await supabase.from('usuarios').select('id').limit(1).single();
      const usuarioId = user ? user.id : null;

      const { data: nuevaCaja, error: errCaja } = await supabase.from('apertura_cajas').insert({
        sucursal_id: sucursal.id,
        usuario_id: usuarioId, // Puede ser null si la BD lo permite
        monto_inicial: 100,
        estado: 'abierta'
      }).select().single();
      
      if (errCaja) {
        console.warn('Atención: No se pudo crear apertura de caja (quizás usuario_id es null y es requerido).', errCaja);
        throw errCaja;
      }
      apertura = nuevaCaja;
    }

    // 5. Crear pedidos aleatorios para el historial
    console.log('Generando 15 pedidos de prueba para historial y dashboard...');
    const metodosPago = ['efectivo', 'qr']; // Solo estos 2 según el schema
    
    // Obtener fecha actual y retroceder hasta 7 días para distribuir los pedidos
    const hoy = new Date();
    
    for (let i = 0; i < 15; i++) {
      // Elegir de 1 a 3 productos al azar
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let totalPedido = 0;
      
      for (let j = 0; j < numItems; j++) {
        const prod = productosBase[Math.floor(Math.random() * productosBase.length)];
        const cantidad = Math.floor(Math.random() * 3) + 1;
        const subtotal = prod.precio_base * cantidad;
        items.push({
          producto_id: prod.id,
          cantidad: cantidad,
          precio_unitario: prod.precio_base
        });
        totalPedido += subtotal;
      }

      // Distribuir pedidos en los últimos 7 días
      const fechaPedido = new Date(hoy);
      fechaPedido.setDate(hoy.getDate() - Math.floor(Math.random() * 7));
      fechaPedido.setHours(Math.floor(Math.random() * 12) + 10); // Horas de 10am a 10pm
      
      // A. Insertar Pedido
      const { data: nuevoPedido, error: errPed } = await supabase.from('pedidos').insert({
        total: totalPedido,
        estado: 'pagado',
        apertura_caja_id: apertura.id,
        created_at: fechaPedido.toISOString()
      }).select().single();

      if (errPed) throw errPed;

      // B. Insertar Pago
      const metodo = metodosPago[Math.floor(Math.random() * metodosPago.length)];
      await supabase.from('pagos').insert({
        pedido_id: nuevoPedido.id,
        metodo: metodo,
        monto: totalPedido,
        created_at: fechaPedido.toISOString()
      });

      // C. Insertar Detalles
      const detallesConPedidoId = items.map(item => ({ ...item, pedido_id: nuevoPedido.id }));
      await supabase.from('detalle_pedidos').insert(detallesConPedidoId);
    }

    console.log('✅ ¡Población de datos completada exitosamente!');
    console.log('Ya puedes ver categorías, productos y estadísticas en la aplicación web.');

  } catch (error) {
    console.error('❌ Error general durante el seed:', error);
  }
}

main();
