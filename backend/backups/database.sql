-- --------------------------------------------------------
-- Host:                         46.253.45.22
-- Versión del servidor:         10.4.13-MariaDB-1:10.4.13+maria~focal - mariadb.org binary distribution
-- SO del servidor:              debian-linux-gnu
-- HeidiSQL Versión:             12.6.0.6765
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE = @@TIME_ZONE */;
/*!40103 SET TIME_ZONE = '+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0 */;
/*!40101 SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES = @@SQL_NOTES, SQL_NOTES = 0 */;


-- Volcando estructura de base de datos para zertipower-dev
CREATE DATABASE IF NOT EXISTS `zertipower-dev` /*!40100 DEFAULT CHARACTER SET armscii8 COLLATE armscii8_bin */;
USE `zertipower-dev`;

-- Volcando estructura para tabla zertipower-dev.blockchains
CREATE TABLE IF NOT EXISTS `blockchains`
(
    `blockchain_id`     int(11) NOT NULL,
    `blockchain_name`   varchar(50) COLLATE armscii8_bin DEFAULT NULL,
    `rpc_url`           varchar(50) COLLATE armscii8_bin DEFAULT NULL,
    `blockchain_tx_url` varchar(50) COLLATE armscii8_bin DEFAULT NULL,
    PRIMARY KEY (`blockchain_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.calendar
CREATE TABLE IF NOT EXISTS `calendar`
(
    `day`          date NOT NULL,
    `weekday`      varchar(50) CHARACTER SET utf8 DEFAULT NULL,
    `day_type`     varchar(50) CHARACTER SET utf8 DEFAULT NULL,
    `festive_type` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
    `festivity`    varchar(50) CHARACTER SET utf8 DEFAULT NULL,
    `updated_at`   datetime                       DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `created_at`   datetime                       DEFAULT current_timestamp(),
    UNIQUE KEY `day` (`day`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8
  COLLATE = utf8_spanish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.communities
CREATE TABLE IF NOT EXISTS `communities`
(
    `id`           int(11) NOT NULL AUTO_INCREMENT,
    `name`         varchar(50) COLLATE armscii8_bin DEFAULT NULL,
    `test`         tinyint(4)                       DEFAULT current_timestamp(),
    `energy_price` double(6, 3)                     DEFAULT NULL,
    `lat`          double(9, 6)                     DEFAULT NULL,
    `lng`          double(9, 6)                     DEFAULT NULL,
    `location_id`  int(11)                          DEFAULT NULL,
    `created_at`   datetime                         DEFAULT current_timestamp(),
    `updated_at`   datetime                         DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 18
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.cups
CREATE TABLE IF NOT EXISTS `cups`
(
    `id`                   int(11)                           NOT NULL AUTO_INCREMENT,
    `cups`                 varchar(50) COLLATE armscii8_bin  NOT NULL                               DEFAULT '',
    `provider_id`          int(11)                           NOT NULL                               DEFAULT 0,
    `community_id`         int(11)                           NOT NULL                               DEFAULT 0,
    `surplus_distribution` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin                       DEFAULT NULL,
    `location_id`          int(11)                           NOT NULL                               DEFAULT 0,
    `address`              varchar(50) COLLATE armscii8_bin  NOT NULL                               DEFAULT '',
    `customer_id`          int(11)                                                                  DEFAULT NULL,
    `lng`                  double                                                                   DEFAULT NULL,
    `lat`                  double                                                                   DEFAULT NULL,
    `type`                 enum ('consumer','producer','prosumer','community') COLLATE armscii8_bin DEFAULT NULL,
    `datadis_active`       tinyint(4)                                                               DEFAULT 0,
    `datadis_user`         varchar(50) COLLATE armscii8_bin                                         DEFAULT NULL,
    `datadis_password`     varchar(100) COLLATE armscii8_bin                                        DEFAULT NULL,
    `smart_meter_active`   tinyint(4)                                                               DEFAULT 0,
    `smart_meter_model`    varchar(100) COLLATE armscii8_bin NOT NULL                               DEFAULT '',
    `smart_meter_api_key`  varchar(50) COLLATE armscii8_bin                                         DEFAULT NULL,
    `inverter_active`      tinyint(4)                        NOT NULL                               DEFAULT 0,
    `inverter_model`       varchar(100) COLLATE armscii8_bin                                        DEFAULT NULL,
    `inverter_api_key`     varchar(50) COLLATE armscii8_bin                                         DEFAULT NULL,
    `sensor_active`        tinyint(4)                        NOT NULL                               DEFAULT 0,
    `sensor_model`         varchar(50) COLLATE armscii8_bin                                         DEFAULT NULL,
    `sensor_api_key`       varchar(50) COLLATE armscii8_bin                                         DEFAULT NULL,
    `created_at`           datetime                                                                 DEFAULT current_timestamp(),
    `updated_at`           datetime                                                                 DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 51
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.customers
CREATE TABLE IF NOT EXISTS `customers`
(
    `id`             int(11) NOT NULL AUTO_INCREMENT,
    `name`           varchar(50) COLLATE armscii8_bin  DEFAULT NULL,
    `dni`            varchar(50) COLLATE armscii8_bin  DEFAULT NULL,
    `wallet_address` varchar(200) COLLATE armscii8_bin DEFAULT NULL,
    `created_at`     datetime                          DEFAULT current_timestamp(),
    `updated_at`     datetime                          DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 27
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.datadis_energy_registers
CREATE TABLE IF NOT EXISTS `datadis_energy_registers`
(
    `id`             int(11) NOT NULL AUTO_INCREMENT,
    `info_dt`        datetime     DEFAULT NULL,
    `cups_id`        int(11)      DEFAULT NULL,
    `transaction_id` int(11)      DEFAULT NULL,
    `import`         double(6, 3) DEFAULT NULL,
    `export`         double(6, 3) DEFAULT NULL,
    `created_at`     datetime     DEFAULT current_timestamp(),
    `updated_at`     datetime     DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`) USING BTREE,
    KEY `info_dt` (`info_dt`) USING BTREE,
    KEY `cups_id` (`cups_id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 22501
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin
  ROW_FORMAT = DYNAMIC;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.energy_areas
CREATE TABLE IF NOT EXISTS `energy_areas`
(
    `id`                  int(11)   NOT NULL AUTO_INCREMENT,
    `reference`           varchar(50) COLLATE armscii8_bin                   DEFAULT NULL,
    `inclination`         double                                             DEFAULT NULL,
    `kWh_p`               double                                             DEFAULT NULL,
    `kWh_inversor`        double                                             DEFAULT NULL,
    `n_plaques`           int(11)                                            DEFAULT NULL,
    `creation_dt`         datetime                                           DEFAULT curdate(),
    `update_dt`           timestamp NULL                                     DEFAULT NULL ON UPDATE current_timestamp(),
    `type`                varchar(50) COLLATE armscii8_bin                   DEFAULT NULL,
    `origin`              varchar(50) COLLATE armscii8_bin                   DEFAULT 'CatastRo',
    `m2`                  int(11)                                            DEFAULT NULL,
    `cadastral_reference` varchar(50) COLLATE armscii8_bin                   DEFAULT NULL,
    `geojson_feature`     longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
    `location_id`         int(11)                                            DEFAULT NULL,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 10121
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.energy_area_coordinates
CREATE TABLE IF NOT EXISTS `energy_area_coordinates`
(
    `id`             int(11)        NOT NULL AUTO_INCREMENT,
    `energy_area_id` int(11)        NOT NULL DEFAULT 0,
    `lat`            decimal(20, 6) NOT NULL DEFAULT 0.000000,
    `lng`            decimal(20, 6) NOT NULL DEFAULT 0.000000,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 117504
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.energy_blocks
CREATE TABLE IF NOT EXISTS `energy_blocks`
(
    `id`                int(11)                          NOT NULL AUTO_INCREMENT,
    `reference`         varchar(50) COLLATE armscii8_bin NOT NULL DEFAULT '0',
    `expiration_dt`     datetime                                  DEFAULT NULL,
    `active_init`       time                             NOT NULL DEFAULT '00:00:00',
    `active_end`        time                             NOT NULL DEFAULT '00:00:00',
    `consumption_price` double(6, 4)                              DEFAULT NULL,
    `generation_price`  double(6, 4)                              DEFAULT NULL,
    `provider_id`       int(11)                          NOT NULL DEFAULT 0,
    `created_at`        datetime                         NOT NULL DEFAULT curdate(),
    `updated_at`        datetime                                  DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 15
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.energy_registers
CREATE TABLE IF NOT EXISTS `energy_registers`
(
    `id`                   int(11) NOT NULL AUTO_INCREMENT,
    `info_dt`              datetime                          DEFAULT NULL,
    `cups_id`              int(11)                           DEFAULT NULL,
    `import`               double(6, 3)                      DEFAULT NULL,
    `community_generation` double(6, 3)                      DEFAULT NULL,
    `virtual_generation`   double(6, 3)                      DEFAULT NULL,
    `consumption`          double(6, 3)                      DEFAULT NULL,
    `export`               double(6, 3)                      DEFAULT NULL,
    `generation`           double(6, 3)                      DEFAULT NULL,
    `origin`               varchar(200) COLLATE armscii8_bin DEFAULT NULL,
    `type`                 varchar(200) COLLATE armscii8_bin DEFAULT NULL,
    `created_at`           datetime                          DEFAULT current_timestamp(),
    `updated_at`           datetime                          DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`) USING BTREE,
    KEY `info_dt` (`info_dt`),
    KEY `cups_id` (`cups_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 648528
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.energy_registers_logs
CREATE TABLE IF NOT EXISTS `energy_registers_logs`
(
    `id`          int(11)   NOT NULL AUTO_INCREMENT,
    `cups`        varchar(100) COLLATE armscii8_bin DEFAULT NULL,
    `n_registers` int(11)                           DEFAULT NULL,
    `creation_dt` timestamp NULL                    DEFAULT curdate(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para vista zertipower-dev.energy_registers_original_hourly
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `energy_registers_original_hourly`
(
    `cups_id`       INT(11)       NULL,
    `info_datetime` DATETIME      NULL,
    `import`        DOUBLE(20, 3) NULL,
    `consumption`   DOUBLE(20, 3) NULL,
    `export`        DOUBLE(20, 3) NULL,
    `generation`    DOUBLE(20, 3) NULL
) ENGINE = MyISAM;

-- Volcando estructura para vista zertipower-dev.energy_registers_original_monthly
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE `energy_registers_original_monthly`
(
    `cups_id`     INT(11)       NULL,
    `year`        INT(4)        NULL,
    `month`       INT(2)        NULL,
    `import`      DOUBLE(20, 3) NULL,
    `consumption` DOUBLE(20, 3) NULL,
    `export`      DOUBLE(20, 3) NULL,
    `generation`  DOUBLE(20, 3) NULL
) ENGINE = MyISAM;

-- Volcando estructura para tabla zertipower-dev.energy_transactions
CREATE TABLE IF NOT EXISTS `energy_transactions`
(
    `id`            int(11) NOT NULL AUTO_INCREMENT,
    `cups_id`       int(11)                           DEFAULT NULL,
    `info_dt`       datetime                          DEFAULT NULL,
    `kwh_in`        double(6, 3)                      DEFAULT NULL,
    `kwh_out`       double(6, 3)                      DEFAULT NULL,
    `kwh_surplus`   double(6, 3)                      DEFAULT NULL,
    `kwh_in_price`  double(5, 3)                      DEFAULT NULL,
    `kwh_out_price` double(5, 3)                      DEFAULT NULL,
    `tx_kwh_in`     varchar(100) COLLATE armscii8_bin DEFAULT NULL,
    `tx_kwh_out`    varchar(100) COLLATE armscii8_bin DEFAULT NULL,
    `block_id`      int(11)                           DEFAULT NULL,
    `created_at`    datetime                          DEFAULT current_timestamp(),
    `updated_at`    datetime                          DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 161044
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.inverter_energy_registers
CREATE TABLE IF NOT EXISTS `inverter_energy_registers`
(
    `id`             int(11) NOT NULL AUTO_INCREMENT,
    `info_dt`        datetime     DEFAULT NULL,
    `cups_id`        int(11)      DEFAULT NULL,
    `import`         double(6, 3) DEFAULT NULL,
    `consumption`    double(6, 3) DEFAULT NULL,
    `export`         double(6, 3) DEFAULT NULL,
    `generation`     double(6, 3) DEFAULT NULL,
    `transaction_id` double(6, 3) DEFAULT NULL,
    `created_at`     datetime     DEFAULT current_timestamp(),
    `updated_at`     datetime     DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`) USING BTREE,
    KEY `info_dt` (`info_dt`) USING BTREE,
    KEY `cups_id` (`cups_id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 648102
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin
  ROW_FORMAT = DYNAMIC;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.locations
CREATE TABLE IF NOT EXISTS `locations`
(
    `id`           int(11) NOT NULL AUTO_INCREMENT,
    `municipality` varchar(50) COLLATE armscii8_bin DEFAULT NULL,
    `province`     varchar(50) COLLATE armscii8_bin DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 14
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.logs
CREATE TABLE IF NOT EXISTS `logs`
(
    `id`                   int(11)                                            NOT NULL AUTO_INCREMENT,
    `origin`               varchar(100) COLLATE armscii8_bin                       DEFAULT NULL,
    `cups`                 varchar(100) COLLATE armscii8_bin                       DEFAULT NULL,
    `cups_id`              int(11)                                                 DEFAULT NULL,
    `status`               enum ('error','success','warning') COLLATE armscii8_bin DEFAULT NULL,
    `operation`            varchar(200) COLLATE armscii8_bin                       DEFAULT NULL,
    `n_affected_registers` int(11)                                                 DEFAULT NULL,
    `log`                  longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    `error_message`        longtext CHARACTER SET utf8 COLLATE utf8_bin       NOT NULL,
    `creation_dt`          datetime                                                DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1951
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.permissions
CREATE TABLE IF NOT EXISTS `permissions`
(
    `resource` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `action`   varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`resource`, `action`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.providers
CREATE TABLE IF NOT EXISTS `providers`
(
    `id`       int(11) NOT NULL AUTO_INCREMENT,
    `provider` varchar(50) COLLATE armscii8_bin DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 10
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.reports
CREATE TABLE IF NOT EXISTS `reports`
(
    `id`         int(11)                                 NOT NULL AUTO_INCREMENT,
    `name`       varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `sql`        varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `params`     varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `columns`    varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` datetime(3)                             NOT NULL DEFAULT current_timestamp(3),
    `updated_at` datetime(3)                             NOT NULL DEFAULT current_timestamp(3),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.roles
CREATE TABLE IF NOT EXISTS `roles`
(
    `id`   int(11)                                 NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `roles_name_key` (`name`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 3
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.role_permission
CREATE TABLE IF NOT EXISTS `role_permission`
(
    `role_id`             int(11)                                 NOT NULL,
    `permission_resource` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `permission_action`   varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `allow`               tinyint(1)                              NOT NULL,
    PRIMARY KEY (`role_id`, `permission_action`, `permission_resource`),
    KEY `role_permission_permission_resource_permission_action_fkey` (`permission_resource`, `permission_action`),
    CONSTRAINT `role_permission_permission_resource_permission_action_fkey` FOREIGN KEY (`permission_resource`, `permission_action`) REFERENCES `permissions` (`resource`, `action`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `role_permission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.smart_contracts
CREATE TABLE IF NOT EXISTS `smart_contracts`
(
    `id`               int(11)                          NOT NULL AUTO_INCREMENT,
    `name`             varchar(50) COLLATE armscii8_bin NOT NULL DEFAULT '0',
    `contract_address` varchar(100) COLLATE armscii8_bin         DEFAULT NULL,
    `blockchain_id`    int(11)                                   DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 7
  DEFAULT CHARSET = armscii8
  COLLATE = armscii8_bin;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.users
CREATE TABLE IF NOT EXISTS `users`
(
    `id`                    int(11)     NOT NULL AUTO_INCREMENT,
    `username`              varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `firstname`             varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `lastname`              varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `password`              varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email`                 varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `wallet_address`        varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at`            datetime(3) NOT NULL                    DEFAULT current_timestamp(3),
    `updated_at`            datetime(3) NOT NULL                    DEFAULT current_timestamp(3),
    `recover_password_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `role_id`               int(11)     NOT NULL,
    PRIMARY KEY (`id`),
    KEY `users_role_id_fkey` (`role_id`),
    KEY `email` (`email`) USING BTREE,
    CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE = InnoDB
  AUTO_INCREMENT = 26
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.user_oauth
CREATE TABLE IF NOT EXISTS `user_oauth`
(
    `oauth_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `type`     varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    `user_id`  int(11)                                 NOT NULL,
    PRIMARY KEY (`oauth_id`, `user_id`),
    KEY `user_oauth_user_id_fkey` (`user_id`),
    CONSTRAINT `user_oauth_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla zertipower-dev.user_tokens
CREATE TABLE IF NOT EXISTS `user_tokens`
(
    `id`              int(11)                                 NOT NULL AUTO_INCREMENT,
    `token`           varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    `expiration_time` datetime(3)                             NOT NULL,
    `user_id`         int(11)                                 NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 83
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `energy_registers_original_hourly`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `energy_registers_original_hourly` AS
select `energy_registers`.`cups_id`                                                                     AS `cups_id`,
       str_to_date(date_format(`energy_registers`.`info_dt`, '%Y-%m-%d %H:00:00'),
                   '%Y-%m-%d %H:%i:%s')                                                                 AS `info_datetime`,
       sum(`energy_registers`.`import`)                                                                 AS `import`,
       sum(`energy_registers`.`consumption`)                                                            AS `consumption`,
       sum(`energy_registers`.`export`)                                                                 AS `export`,
       sum(`energy_registers`.`generation`)                                                             AS `generation`
from `energy_registers`
group by date_format(`energy_registers`.`info_dt`, '%Y-%m-%d %H:00:00'), `energy_registers`.`cups_id`;

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS `energy_registers_original_monthly`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `energy_registers_original_monthly` AS
select `energy_registers`.`cups_id`          AS `cups_id`,
       year(`energy_registers`.`info_dt`)    AS `year`,
       month(`energy_registers`.`info_dt`)   AS `month`,
       sum(`energy_registers`.`import`)      AS `import`,
       sum(`energy_registers`.`consumption`) AS `consumption`,
       sum(`energy_registers`.`export`)      AS `export`,
       sum(`energy_registers`.`generation`)  AS `generation`
from `energy_registers`
group by `energy_registers`.`cups_id`, year(`energy_registers`.`info_dt`), month(`energy_registers`.`info_dt`)
order by `energy_registers`.`cups_id`, month(`energy_registers`.`info_dt`);

/*!40103 SET TIME_ZONE = IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE = IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS = IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT = @OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES = IFNULL(@OLD_SQL_NOTES, 1) */;


-- Volcando datos para la tabla zertipower-dev.users: ~9 rows (aproximadamente)
INSERT IGNORE INTO `users` (`id`, `username`, `firstname`, `lastname`, `password`, `email`, `wallet_address`,
                            `created_at`, `updated_at`, `recover_password_code`, `role_id`)
VALUES (1, 'admin', 'admin', 'admin', '$2b$14$XcYl5Npc5Lt191baLYorU.sNcEXDtQDgMr1jX.pX8wEfTAx8ezaJ.',
        'admin@example.com', '', '2023-11-23 08:09:27.220',
        '2023-11-23 08:09:27.220', NULL, 1);



-- --------------------------------------------------------
-- Host:                         46.253.45.22
-- Versión del servidor:         10.4.13-MariaDB-1:10.4.13+maria~focal - mariadb.org binary distribution
-- SO del servidor:              debian-linux-gnu
-- HeidiSQL Versión:             12.6.0.6765
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE = @@TIME_ZONE */;
/*!40103 SET TIME_ZONE = '+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0 */;
/*!40101 SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES = @@SQL_NOTES, SQL_NOTES = 0 */;






