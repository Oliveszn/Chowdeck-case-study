CREATE TABLE IF NOT EXISTS cities (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  rollout_status  ENUM('radius_only', 'shadow', 'polygon_only') NOT NULL DEFAULT 'radius_only',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legacy_radius_configs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  city_id     INT NOT NULL,
  center_lat  DECIMAL(9,6) NOT NULL,
  center_lng  DECIMAL(9,6) NOT NULL,
  radius_km   DECIMAL(5,2) NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  city_id     INT NOT NULL,
  name        VARCHAR(100),
  polygon     JSON NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE IF NOT EXISTS zone_exceptions (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  zone_id     INT NOT NULL,
  reason      ENUM('weather', 'rider_shortage', 'time_restriction') NOT NULL,
  geometry    JSON,
  starts_at   TIMESTAMP NOT NULL,
  ends_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES delivery_zones(id)
);

CREATE TABLE IF NOT EXISTS delivery_checks (
  id               BIGINT PRIMARY KEY AUTO_INCREMENT,
  city_id          INT NOT NULL,
  lat              DECIMAL(9,6) NOT NULL,
  lng              DECIMAL(9,6) NOT NULL,
  radius_result    BOOLEAN NOT NULL,
  polygon_result   BOOLEAN,
  final_decision   BOOLEAN NOT NULL,
  decision_source  ENUM('radius', 'polygon') NOT NULL,
  checked_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE IF NOT EXISTS rider_locations (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  rider_id    INT NOT NULL,
  lat         DECIMAL(9,6) NOT NULL,
  lng         DECIMAL(9,6) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zone_events (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  rider_id    INT NOT NULL,
  zone_id     INT NOT NULL,
  event_type  ENUM('enter', 'exit') NOT NULL,
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES delivery_zones(id)
);