-- No legacy configurations are copied: their owners are unknown.
CREATE TABLE IF NOT EXISTS member_solar_configurations (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          community_id INT NOT NULL,
          customer_id INT NOT NULL,
          roof_reference VARCHAR(100) NOT NULL,
          latitude DOUBLE NOT NULL, longitude DOUBLE NOT NULL,
          area_m2 DOUBLE NOT NULL, tilt DOUBLE NOT NULL, azimuth DOUBLE NOT NULL,
          panel_count INT NOT NULL, kwp DOUBLE NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY community_roof (community_id, roof_reference),
          INDEX member (community_id, customer_id),
          FOREIGN KEY (community_id) REFERENCES communities(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
