const { createClient } = require('@supabase/supabase-js');

// =========================================================================
// CONFIGURACIÓN DE SUPABASE
// =========================================================================
const SUPABASE_URL = 'https://chtfqkriruyxvjxmmazl.supabase.co';

// ⚠️ IMPORTANTE: Necesitas usar la clave "service_role" (Service Role Key)
// No uses la clave pública (anon key) porque no tiene permisos para listar
// ni modificar usuarios desde la API administrativa.
// Puedes encontrarla en tu Dashboard de Supabase: Project Settings -> API
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PEGA_AQUI_TU_SERVICE_ROLE_KEY';

// La nueva contraseña que tendrán todos los usuarios:
const NUEVA_PASSWORD_GENERICA = 'Kjaras2026*';

// =========================================================================

// Inicializamos el cliente saltándonos las restricciones de permisos (gracias al service_role)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetearContrasenas() {
  console.log('🔄 Conectando con Supabase para obtener usuarios...');
  
  // 1. Obtener todos los usuarios de Auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error al obtener usuarios. Asegúrate de estar usando el SERVICE ROLE KEY válido.');
    console.error('Detalles:', error.message);
    return;
  }

  console.log(`\n📋 Se encontraron ${users.length} usuarios en el sistema:\n`);
  
  users.forEach(u => {
    console.log(`  - ${u.email} (ID: ${u.id})`);
  });

  console.log(`\n=================================================`);
  console.log(`INICIANDO RESETEO A LA CONTRASEÑA: "${NUEVA_PASSWORD_GENERICA}"`);
  console.log(`=================================================\n`);

  let actualizados = 0;
  
  // 2. Recorrer y actualizar cada uno
  for (const user of users) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: NUEVA_PASSWORD_GENERICA }
    );
    
    if (updateError) {
      console.error(`❌ Error al resetear ${user.email}:`, updateError.message);
    } else {
      console.log(`✅ Contraseña de ${user.email} actualizada con éxito.`);
      actualizados++;
    }
  }

  console.log(`\n🎉 ¡PROCESO FINALIZADO!`);
  console.log(`${actualizados} de ${users.length} cuentas han sido reseteadas exitosamente.`);
  console.log(`Tus usuarios pueden iniciar sesión ahora usando: ${NUEVA_PASSWORD_GENERICA}\n`);
}

resetearContrasenas();
