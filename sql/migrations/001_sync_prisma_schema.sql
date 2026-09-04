-- ===================================================================
-- Migración 001 — Sincronizar el esquema con prisma/schema.prisma
-- ===================================================================
-- Motivo:
--   El esquema declarado en prisma/schema.prisma va POR DELANTE de la
--   base de datos de producción. Dos objetos están declarados en el
--   modelo pero no existen en la BD real:
--
--     1. La columna `cups.origin`
--     2. La tabla `energy_realtime`
--
--   Consecuencia si no se aplica: al desplegar la rama actual,
--   `GET /cups` devuelve HTTP 500 con el error
--   "The column `cups.origin` does not exist in the current database",
--   y el Panel de Administración deja de listar los CUPS.
--
-- IMPORTANTE — orden de despliegue:
--   Esta migración debe aplicarse JUNTO con la corrección de
--   energy-hourly.controller.ts (columna `origin` cualificada). Al
--   crear `cups.origin`, la consulta de `/energy-hourly` pasa a tener
--   una columna ambigua entre `energy_hourly` y `cups` y falla con
--   "Column 'origin' in SELECT is ambiguous".
--   Aplicar sólo esta migración ROMPE /energy-hourly.
--
-- Idempotente: se puede ejecutar varias veces sin efectos adicionales.
-- Sólo añade objetos; no modifica ni borra datos existentes.
--
-- Uso (local):
--   docker exec -i mariadb-zertipower-local \
--     mariadb -u root -proot zertipower-dev < sql/migrations/001_sync_prisma_schema.sql
-- ===================================================================

-- --- 1. Columna cups.origin ------------------------------------------
-- Declarada en Prisma como: origin String? @db.VarChar(200)
ALTER TABLE `cups`
  ADD COLUMN IF NOT EXISTS `origin` VARCHAR(200) NULL AFTER `cups`;

-- --- 2. Tabla energy_realtime ----------------------------------------
-- Declarada en Prisma como el modelo EnergyRealtime.
CREATE TABLE IF NOT EXISTS `energy_realtime` (
  `id`                       INT(11)      NOT NULL AUTO_INCREMENT,
  `origin`                   VARCHAR(255) DEFAULT NULL,
  `reference`                VARCHAR(255) DEFAULT NULL,
  `info_dt`                  DATETIME     DEFAULT NULL,
  `accumulative_consumption` DOUBLE       DEFAULT NULL,
  `accumulative_production`  DOUBLE       DEFAULT NULL,
  `consumption`              DOUBLE       DEFAULT NULL,
  `production`               DOUBLE       DEFAULT NULL,
  `created_at`               DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- --- Verificación -----------------------------------------------------
-- Ambas consultas deben devolver 1.
SELECT COUNT(*) AS cups_origin_ok
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'cups' AND column_name = 'origin';

SELECT COUNT(*) AS energy_realtime_ok
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'energy_realtime';
