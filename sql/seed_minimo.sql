-- ===================================================================
-- seed_minimo.sql - Zertipower / Ris3CAT
-- ===================================================================
-- Entorno de desarrollo minimo, autocontenido y SIN dependencia del
-- servidor remoto de produccion.
--
-- El esquema NO procede de backend/backups/database.sql (ese volcado
-- esta obsoleto: le faltan 15 tablas y la columna users.customer_id que
-- el codigo actual necesita). Se ha regenerado desde prisma/schema.prisma
-- con `prisma db push`, que es la fuente de verdad del backend.
--
-- Contenido:
--   * Esquema integro: 39 tablas + 2 vistas.
--   * 1 rol ADMIN y 1 rol USER.
--   * 1 usuario administrador de prueba (admin / admin123).
--   * 1 cliente, 1 localidad y 1 proveedor de apoyo.
--   * 1 comunidad energetica demo.
--   * 2 CUPS / smart meters vinculados a esa comunidad.
--
-- Uso sobre una base de datos vacia:
--   docker compose -f docker-compose.db.yml up -d
--   docker exec -i mariadb-zertipower-local mariadb -u root -proot < sql/seed_minimo.sql
-- ===================================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE = @@TIME_ZONE */;
/*!40103 SET TIME_ZONE = '+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0 */;
/*!40101 SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO' */;

CREATE DATABASE IF NOT EXISTS `zertipower-dev`
  /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `zertipower-dev`;

-- ===================================================================
-- ESQUEMA (generado desde prisma/schema.prisma)
-- ===================================================================
/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `blockchains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `blockchains` (
  `blockchain_id` int(11) NOT NULL,
  `blockchain_name` varchar(50) DEFAULT NULL,
  `rpc_url` varchar(50) DEFAULT NULL,
  `blockchain_tx_url` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`blockchain_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `calendar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar` (
  `day` date NOT NULL,
  `weekday` varchar(50) DEFAULT NULL,
  `day_type` varchar(50) DEFAULT NULL,
  `festive_type` varchar(50) DEFAULT NULL,
  `festivity` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  UNIQUE KEY `day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `communities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `communities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `test` tinyint(4) DEFAULT NULL,
  `energy_price` double DEFAULT 0.09,
  `trade_type` enum('PREFERRED','EQUITABLE') DEFAULT 'PREFERRED',
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `dao_address` varchar(50) DEFAULT NULL,
  `wallet_address` varchar(150) DEFAULT NULL,
  `wallet_pwd` varchar(150) DEFAULT NULL,
  `dao_name` varchar(255) DEFAULT NULL,
  `dao_symbol` varchar(50) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cups` varchar(50) NOT NULL DEFAULT '',
  `origin` varchar(200) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `provider_id` int(11) NOT NULL DEFAULT 0,
  `community_id` int(11) DEFAULT NULL,
  `surplus_distribution` double DEFAULT NULL,
  `location_id` int(11) NOT NULL DEFAULT 0,
  `address` varchar(50) NOT NULL DEFAULT '',
  `customer_id` int(11) DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `type` enum('consumer','producer','prosumer','community') DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `datadis_active` tinyint(1) DEFAULT 0,
  `datadis_user` varchar(50) DEFAULT NULL,
  `datadis_password` varchar(100) DEFAULT NULL,
  `smart_meter_active` tinyint(1) DEFAULT 0,
  `smart_meter_model` varchar(100) NOT NULL DEFAULT '',
  `smart_meter_api_key` varchar(50) DEFAULT NULL,
  `inverter_active` tinyint(1) NOT NULL DEFAULT 0,
  `inverter_model` varchar(100) DEFAULT NULL,
  `inverter_api_key` varchar(50) DEFAULT NULL,
  `sensor_active` tinyint(1) NOT NULL DEFAULT 0,
  `sensor_model` varchar(100) DEFAULT NULL,
  `sensor_api_key` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `dni` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `balance` double DEFAULT NULL,
  `wallet_address` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `datadis_energy_registers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `datadis_energy_registers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `info_dt` datetime DEFAULT NULL,
  `cups_id` int(11) DEFAULT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `import` double DEFAULT NULL,
  `export` double DEFAULT NULL,
  `tx_import` varchar(191) DEFAULT NULL,
  `tx_export` varchar(191) DEFAULT NULL,
  `updates_counter` int(11) DEFAULT NULL,
  `updates_historic` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`updates_historic`)),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cups_id` (`cups_id`),
  KEY `info_dt` (`info_dt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_area_coordinates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_area_coordinates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `energy_area_id` int(11) NOT NULL DEFAULT 0,
  `lat` decimal(20,6) NOT NULL DEFAULT 0.000000,
  `lng` decimal(20,6) NOT NULL DEFAULT 0.000000,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_areas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference` varchar(50) DEFAULT NULL,
  `inclination` double DEFAULT NULL,
  `kWh_p` double DEFAULT NULL,
  `kWh_inversor` double DEFAULT NULL,
  `n_plaques` int(11) DEFAULT NULL,
  `creation_dt` datetime DEFAULT curdate(),
  `update_dt` timestamp NULL DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `origin` varchar(50) DEFAULT 'CatastRo',
  `m2` int(11) DEFAULT NULL,
  `cadastral_reference` varchar(50) DEFAULT NULL,
  `geojson_feature` longtext DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_blocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference` varchar(50) NOT NULL DEFAULT '0',
  `expiration_dt` datetime DEFAULT NULL,
  `active_init` time NOT NULL DEFAULT '00:00:00',
  `active_end` time NOT NULL DEFAULT '00:00:00',
  `consumption_price` double DEFAULT NULL,
  `generation_price` double DEFAULT NULL,
  `provider_id` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT curdate(),
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_hourly`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_hourly` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cups_id` int(11) DEFAULT NULL,
  `info_dt` datetime DEFAULT NULL,
  `kwh_in` double DEFAULT NULL,
  `kwh_in_virtual` double DEFAULT NULL,
  `kwh_in_shared` double DEFAULT NULL,
  `kwh_out` double DEFAULT NULL,
  `kwh_out_virtual` double DEFAULT NULL,
  `kwh_out_shared` double DEFAULT NULL,
  `kwh_in_price` double DEFAULT NULL,
  `kwh_out_price` double DEFAULT NULL,
  `kwh_in_price_community` double DEFAULT NULL,
  `kwh_out_price_community` double DEFAULT NULL,
  `production` double DEFAULT NULL,
  `battery` double DEFAULT NULL,
  `shares` double DEFAULT NULL,
  `origin` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_realtime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_realtime` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `origin` varchar(255) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `info_dt` datetime DEFAULT NULL,
  `accumulative_consumption` double DEFAULT NULL,
  `accumulative_production` double DEFAULT NULL,
  `consumption` double DEFAULT NULL,
  `production` double DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_registers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_registers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `info_dt` datetime DEFAULT NULL,
  `cups_id` int(11) DEFAULT NULL,
  `import` double DEFAULT NULL,
  `consumption` double DEFAULT NULL,
  `community_generation` double DEFAULT NULL,
  `virtual_generation` double DEFAULT NULL,
  `export` double DEFAULT NULL,
  `generation` double DEFAULT NULL,
  `origin` varchar(200) DEFAULT NULL,
  `type` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cups_id` (`cups_id`),
  KEY `info_dt` (`info_dt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_registers_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_registers_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cups` varchar(100) DEFAULT NULL,
  `n_registers` int(11) DEFAULT NULL,
  `creation_dt` timestamp NULL DEFAULT curdate(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `energy_registers_original_hourly`;
/*!50001 DROP VIEW IF EXISTS `energy_registers_original_hourly`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `energy_registers_original_hourly` AS SELECT
 NULL AS `cups_id`,
 NULL AS `info_datetime`,
 NULL AS `import`,
 NULL AS `consumption`,
 NULL AS `export`,
 NULL AS `generation` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `energy_registers_original_monthly`;
/*!50001 DROP VIEW IF EXISTS `energy_registers_original_monthly`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `energy_registers_original_monthly` AS SELECT
 NULL AS `cups_id`,
 NULL AS `year`,
 NULL AS `month`,
 NULL AS `import`,
 NULL AS `consumption`,
 NULL AS `export`,
 NULL AS `generation` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `energy_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `energy_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cups_id` int(11) DEFAULT NULL,
  `info_dt` datetime DEFAULT NULL,
  `kwh_in` double DEFAULT NULL,
  `kwh_out` double DEFAULT NULL,
  `kwh_out_virtual` double DEFAULT NULL,
  `kwh_surplus` double DEFAULT NULL,
  `kwh_in_price` double DEFAULT NULL,
  `kwh_out_price` double DEFAULT NULL,
  `kwh_in_price_community` double DEFAULT NULL,
  `kwh_out_price_community` double DEFAULT NULL,
  `tx_kwh_in` varchar(100) DEFAULT NULL,
  `tx_kwh_out` varchar(100) DEFAULT NULL,
  `block_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inverter_energy_registers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inverter_energy_registers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `info_dt` datetime DEFAULT NULL,
  `cups_id` int(11) DEFAULT NULL,
  `import` double DEFAULT NULL,
  `consumption` double DEFAULT NULL,
  `export` double DEFAULT NULL,
  `generation` double DEFAULT NULL,
  `transaction_id` double DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cups_id` (`cups_id`),
  KEY `info_dt` (`info_dt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `municipality` varchar(50) DEFAULT NULL,
  `province` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `origin` varchar(100) DEFAULT NULL,
  `cups` varchar(100) DEFAULT NULL,
  `cups_id` int(11) DEFAULT NULL,
  `status` enum('error','success','warning') DEFAULT NULL,
  `operation` varchar(200) DEFAULT NULL,
  `n_affected_registers` int(11) DEFAULT NULL,
  `log` longtext NOT NULL,
  `error_message` longtext NOT NULL,
  `creation_dt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `non_working_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `non_working_days` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime(3) DEFAULT NULL,
  `provider_id` int(11) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `rate` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_category_id` int(11) DEFAULT NULL,
  `notification` varchar(50) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `created_dt` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_dt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) DEFAULT NULL,
  `created_dt` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_dt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `resource` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  PRIMARY KEY (`resource`,`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `community_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `expiration_dt` datetime(3) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `result_option_id` int(11) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `transparent` tinyint(4) DEFAULT NULL,
  `quorum` double DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `proposals_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proposals_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal_id` int(11) DEFAULT NULL,
  `option` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `providers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `sql` varchar(191) NOT NULL,
  `params` varchar(191) NOT NULL,
  `columns` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal_id` int(11) DEFAULT NULL,
  `proposal_option_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permission` (
  `role_id` int(11) NOT NULL,
  `permission_resource` varchar(191) NOT NULL,
  `permission_action` varchar(191) NOT NULL,
  `allow` tinyint(1) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_action`,`permission_resource`),
  KEY `role_permission_permission_resource_permission_action_fkey` (`permission_resource`,`permission_action`),
  CONSTRAINT `role_permission_permission_resource_permission_action_fkey` FOREIGN KEY (`permission_resource`, `permission_action`) REFERENCES `permissions` (`resource`, `action`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `shares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `community_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `shares` double DEFAULT NULL,
  `status` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `smart_contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `smart_contracts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '0',
  `contract_address` varchar(100) DEFAULT NULL,
  `blockchain_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stripe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stripe` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wallet_address` varchar(255) DEFAULT NULL,
  `session_id` varchar(255) NOT NULL,
  `mint_status` enum('MINTING','ACCEPTED','ERROR') DEFAULT 'MINTING',
  `qty` double DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `stripe_session_id_key` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `trades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `trades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `energy_hourly_from_id` int(11) NOT NULL,
  `energy_hourly_to_id` int(11) NOT NULL,
  `from_cups_id` int(11) NOT NULL,
  `to_cups_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `traded_kwh` double DEFAULT NULL,
  `cost` double DEFAULT NULL,
  `previous_kwh` double DEFAULT NULL,
  `current_kwh` double DEFAULT NULL,
  `info_dt` datetime DEFAULT NULL,
  `created_dt` datetime DEFAULT current_timestamp(),
  `updated_dt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_oauth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_oauth` (
  `oauth_id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`oauth_id`,`user_id`),
  KEY `user_oauth_user_id_fkey` (`user_id`),
  CONSTRAINT `user_oauth_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(500) NOT NULL,
  `expiration_time` datetime(3) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permanent` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `wallet_address` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `recover_password_code` varchar(191) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `users_role_id_fkey` (`role_id`),
  CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `notification_id` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `created_dt` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_dt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users_notifications_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_notifications_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `notification_categories_id` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `created_dt` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_dt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users_notifications_historic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_notifications_historic` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `notification_id` int(11) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `created_dt` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_dt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal_id` int(11) DEFAULT NULL,
  `option_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `vote_value` double DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `energy_registers_original_hourly`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `energy_registers_original_hourly` AS select `energy_registers`.`cups_id` AS `cups_id`,str_to_date(date_format(`energy_registers`.`info_dt`,'%Y-%m-%d %H:00:00'),'%Y-%m-%d %H:%i:%s') AS `info_datetime`,sum(`energy_registers`.`import`) AS `import`,sum(`energy_registers`.`consumption`) AS `consumption`,sum(`energy_registers`.`export`) AS `export`,sum(`energy_registers`.`generation`) AS `generation` from `energy_registers` group by date_format(`energy_registers`.`info_dt`,'%Y-%m-%d %H:00:00'),`energy_registers`.`cups_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `energy_registers_original_monthly`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb3 */;
/*!50001 SET character_set_results     = utf8mb3 */;
/*!50001 SET collation_connection      = utf8mb3_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `energy_registers_original_monthly` AS select `energy_registers`.`cups_id` AS `cups_id`,year(`energy_registers`.`info_dt`) AS `year`,month(`energy_registers`.`info_dt`) AS `month`,sum(`energy_registers`.`import`) AS `import`,sum(`energy_registers`.`consumption`) AS `consumption`,sum(`energy_registers`.`export`) AS `export`,sum(`energy_registers`.`generation`) AS `generation` from `energy_registers` group by `energy_registers`.`cups_id`,year(`energy_registers`.`info_dt`),month(`energy_registers`.`info_dt`) order by `energy_registers`.`cups_id`,month(`energy_registers`.`info_dt`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


-- ===================================================================
-- DATOS MINIMOS INDISPENSABLES
-- ===================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --- Roles -----------------------------------------------------------
-- El nombre 'ADMIN' es OBLIGATORIO y sensible a mayusculas:
-- UserRole.isAdmin() (src/features/roles/domain/UserRole.ts) compara
-- exactamente name === "ADMIN", y RolePermissionGuard deja pasar
-- cualquier peticion de un usuario con ese rol sin consultar la tabla
-- role_permission. Por eso el admin del seed funciona sin permisos.
DELETE FROM `role_permission`;
DELETE FROM `users`;
DELETE FROM `roles`;
INSERT INTO `roles` (`id`, `name`) VALUES
  (1, 'ADMIN'),
  (2, 'USER');

-- --- Catalogos auxiliares --------------------------------------------
DELETE FROM `locations`;
INSERT INTO `locations` (`id`, `municipality`, `province`) VALUES
  (1, 'Barcelona', 'Barcelona');

DELETE FROM `providers`;
INSERT INTO `providers` (`id`, `provider`) VALUES
  (1, 'Proveedor Demo');

DELETE FROM `customers`;
INSERT INTO `customers`
  (`id`, `name`, `dni`, `email`, `balance`, `wallet_address`, `created_at`)
VALUES
  (1, 'Cliente Demo', '00000000T', 'cliente@zertipower.local', 0, NULL, NOW());

-- --- Usuario administrador de prueba ---------------------------------
-- Login:    admin   (tambien admite admin@zertipower.local)
-- Password: admin123
-- Hash bcrypt coste 14, tal y como genera PasswordUtils.encrypt().
INSERT INTO `users`
  (`id`, `customer_id`, `username`, `firstname`, `lastname`, `password`,
   `email`, `wallet_address`, `created_at`, `updated_at`,
   `recover_password_code`, `role_id`)
VALUES
  (1, 1, 'admin', 'Admin', 'Demo',
   '$2b$14$4jk..EX2XrPZXdU4CWDD6OIJtw5qhngabgmlgwePiSi228LMMGQ4C',
   'admin@zertipower.local', NULL, NOW(3), NOW(3), NULL, 1);

-- --- Comunidad energetica demo ---------------------------------------
DELETE FROM `communities`;
INSERT INTO `communities`
  (`id`, `name`, `test`, `energy_price`, `trade_type`,
   `lat`, `lng`, `location_id`, `created_at`)
VALUES
  (1, 'Comunitat Energètica Demo', 0, 0.15, 'PREFERRED',
   41.387017, 2.170047, 1, NOW());

-- --- CUPS / Smart meters vinculados a la comunidad --------------------
-- No hay FOREIGN KEY sobre cups: community_id / provider_id /
-- location_id / customer_id son referencias "blandas" a las filas
-- creadas arriba.
DELETE FROM `cups`;
INSERT INTO `cups`
  (`id`, `cups`, `provider_id`, `community_id`, `surplus_distribution`,
   `location_id`, `address`, `customer_id`, `lng`, `lat`, `type`,
   `active`, `datadis_active`, `smart_meter_active`, `smart_meter_model`,
   `inverter_active`, `sensor_active`, `created_at`)
VALUES
  (1, 'ES0000000000000000AA0A', 1, 1, 0.5, 1,
   'Carrer Demo 1, Barcelona', 1, 2.170047, 41.387017, 'prosumer',
   1, 0, 1, 'demo-meter', 0, 0, NOW()),
  (2, 'ES0000000000000000BB0B', 1, 1, 0.5, 1,
   'Carrer Demo 2, Barcelona', 1, 2.171000, 41.388000, 'consumer',
   1, 0, 1, 'demo-meter', 0, 0, NOW());

SET FOREIGN_KEY_CHECKS = 1;

/*!40103 SET TIME_ZONE = IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE = IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS = IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT = @OLD_CHARACTER_SET_CLIENT */;
