-- Explicit selections for public community simulations; no member identity is inferred.
CREATE TABLE IF NOT EXISTS calculator_community_selections (
 community_id INT NOT NULL, energy_area_id INT NOT NULL, configuration_json LONGTEXT NOT NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (community_id, energy_area_id),
 FOREIGN KEY (community_id) REFERENCES communities(id),
 FOREIGN KEY (energy_area_id) REFERENCES energy_areas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
