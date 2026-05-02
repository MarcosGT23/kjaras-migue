// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {
    // 1. ¿El usuario tiene una sesión activa en Supabase?
    const { data: { session } } = await supabase.client.auth.getSession();

    if (!session) {
      // Si no hay sesión, lo pateamos a la pantalla de Login
      router.navigate(['/login']);
      return false;
    }

    // 2. ¿Qué rol exige esta ruta? (Lo definiremos en app.routes.ts)
    const rolExigido = route.data['rolEsperado']; 

    if (rolExigido) {
      // Consultamos en la base de datos qué rol tiene este usuario
      const { data: usuario, error } = await supabase.client
        .from('usuarios')
        .select('rol')
        .eq('id', session.user.id)
        .single();

      if (error || !usuario) throw new Error('Usuario no encontrado en la base de datos');

      // 3. Si el rol no coincide con lo que exige la ruta, lo redirigimos
      if (usuario.rol !== rolExigido) {
        if (usuario.rol === 'admin') {
          router.navigate(['/admin/dashboard']);
        } else {
          router.navigate(['/caja/apertura']);
        }
        return false; // Bloqueamos el paso a la ruta original
      }
    }

    // Si pasó todas las pruebas, ¡Bienvenido!
    return true;

  } catch (error) {
    console.error('Error en el Guard de Seguridad:', error);
    router.navigate(['/login']);
    return false;
  }
};