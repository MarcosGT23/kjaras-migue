-- =============================================================
-- POLÍTICAS DE SEGURIDAD (RLS) PARA USUARIOS DE CAJA
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- ─────────────────────────────────────────────
-- TABLA: pedidos
-- ─────────────────────────────────────────────
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Los cajeros pueden VER todos los pedidos
DROP POLICY IF EXISTS "cajeros_select_pedidos" ON public.pedidos;
CREATE POLICY "cajeros_select_pedidos"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (true);

-- Los cajeros pueden CREAR pedidos
DROP POLICY IF EXISTS "cajeros_insert_pedidos" ON public.pedidos;
CREATE POLICY "cajeros_insert_pedidos"
  ON public.pedidos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Los cajeros pueden ACTUALIZAR pedidos (ej: anular)
DROP POLICY IF EXISTS "cajeros_update_pedidos" ON public.pedidos;
CREATE POLICY "cajeros_update_pedidos"
  ON public.pedidos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- TABLA: pagos
-- ─────────────────────────────────────────────
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Los cajeros pueden VER los pagos
DROP POLICY IF EXISTS "cajeros_select_pagos" ON public.pagos;
CREATE POLICY "cajeros_select_pagos"
  ON public.pagos FOR SELECT
  TO authenticated
  USING (true);

-- Los cajeros pueden REGISTRAR pagos
DROP POLICY IF EXISTS "cajeros_insert_pagos" ON public.pagos;
CREATE POLICY "cajeros_insert_pagos"
  ON public.pagos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- TABLA: detalle_pedidos
-- ─────────────────────────────────────────────
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;

-- Los cajeros pueden VER el detalle de pedidos
DROP POLICY IF EXISTS "cajeros_select_detalle" ON public.detalle_pedidos;
CREATE POLICY "cajeros_select_detalle"
  ON public.detalle_pedidos FOR SELECT
  TO authenticated
  USING (true);

-- Los cajeros pueden INSERTAR detalles de pedidos
DROP POLICY IF EXISTS "cajeros_insert_detalle" ON public.detalle_pedidos;
CREATE POLICY "cajeros_insert_detalle"
  ON public.detalle_pedidos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- TABLA: apertura_cajas
-- ─────────────────────────────────────────────
ALTER TABLE public.apertura_cajas ENABLE ROW LEVEL SECURITY;

-- Los cajeros pueden VER las cajas
DROP POLICY IF EXISTS "cajeros_select_apertura" ON public.apertura_cajas;
CREATE POLICY "cajeros_select_apertura"
  ON public.apertura_cajas FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- TABLA: productos
-- ─────────────────────────────────────────────
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cajeros_select_productos" ON public.productos;
CREATE POLICY "cajeros_select_productos"
  ON public.productos FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- TABLA: categorias
-- ─────────────────────────────────────────────
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cajeros_select_categorias" ON public.categorias;
CREATE POLICY "cajeros_select_categorias"
  ON public.categorias FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────
-- TABLA: sucursales
-- ─────────────────────────────────────────────
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cajeros_select_sucursales" ON public.sucursales;
CREATE POLICY "cajeros_select_sucursales"
  ON public.sucursales FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================
-- FIN DEL SCRIPT
-- Después de ejecutar esto, el adminClient ya no será necesario
-- y todos los usuarios autenticados tendrán los permisos correctos.
-- =============================================================
