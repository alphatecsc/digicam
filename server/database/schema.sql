-- Schema do Banco de Dados Digicam VMS

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Câmeras
CREATE TABLE IF NOT EXISTS cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    port INTEGER,
    stream_url VARCHAR(500),
    stream_type VARCHAR(50) DEFAULT 'rtsp',
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline',
    ptz_enabled BOOLEAN DEFAULT false,
    recording_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações de Gravação
CREATE TABLE IF NOT EXISTS recording_configs (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    recording_type VARCHAR(50) NOT NULL, -- 'continuous', 'scheduled', 'event'
    schedule_start TIME,
    schedule_end TIME,
    schedule_days INTEGER[], -- Array de dias da semana (0-6)
    event_triggers TEXT[], -- Array de triggers de evento
    storage_path VARCHAR(500),
    retention_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Metadados de Gravação
CREATE TABLE IF NOT EXISTS recordings (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    file_path VARCHAR(500),
    file_size BIGINT,
    duration_seconds INTEGER,
    recording_type VARCHAR(50),
    event_tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Marcadores (Bookmarks)
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    description TEXT,
    tags TEXT[],
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Mosaicos Personalizados
CREATE TABLE IF NOT EXISTS mosaics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    layout_config JSONB NOT NULL, -- Configuração do layout (grid, posições, câmeras)
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Insight (Captura de Tela)
CREATE TABLE IF NOT EXISTS insight_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) DEFAULT 'desktop',
    source_identifier VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Detecção de Movimento
CREATE TABLE IF NOT EXISTS motion_detections (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    detected_at TIMESTAMP NOT NULL,
    region JSONB, -- Coordenadas da região de detecção
    confidence DECIMAL(5,2),
    is_alert BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Regras DVA - Tripwire (Linha de Pedestre)
CREATE TABLE IF NOT EXISTS dva_tripwire (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    line_coordinates JSONB NOT NULL, -- [{x, y}, {x, y}]
    direction VARCHAR(50), -- 'both', 'AtoB', 'BtoA'
    object_types TEXT[], -- ['person', 'vehicle', etc]
    sensitivity INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Eventos Tripwire
CREATE TABLE IF NOT EXISTS tripwire_events (
    id SERIAL PRIMARY KEY,
    tripwire_id INTEGER REFERENCES dva_tripwire(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    detected_at TIMESTAMP NOT NULL,
    direction VARCHAR(50),
    object_type VARCHAR(50),
    confidence DECIMAL(5,2),
    snapshot_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Regras DVA - Perimeter (Cerca Virtual)
CREATE TABLE IF NOT EXISTS dva_perimeter (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    zone_coordinates JSONB NOT NULL, -- Array de pontos formando polígono
    zone_type VARCHAR(50), -- 'entry', 'exit', 'restricted'
    object_types TEXT[],
    sensitivity INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Eventos Perimeter
CREATE TABLE IF NOT EXISTS perimeter_events (
    id SERIAL PRIMARY KEY,
    perimeter_id INTEGER REFERENCES dva_perimeter(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    detected_at TIMESTAMP NOT NULL,
    event_type VARCHAR(50), -- 'entry', 'exit', 'loitering'
    object_type VARCHAR(50),
    confidence DECIMAL(5,2),
    snapshot_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Contagem de Objetos
CREATE TABLE IF NOT EXISTS object_counting (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    counting_zone JSONB NOT NULL, -- Região de contagem
    object_type VARCHAR(50) NOT NULL, -- 'person', 'vehicle', etc
    count_in INTEGER DEFAULT 0,
    count_out INTEGER DEFAULT 0,
    count_total INTEGER DEFAULT 0,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Registros de Contagem
CREATE TABLE IF NOT EXISTS counting_records (
    id SERIAL PRIMARY KEY,
    counting_id INTEGER REFERENCES object_counting(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    detected_at TIMESTAMP NOT NULL,
    direction VARCHAR(50), -- 'in', 'out'
    object_type VARCHAR(50),
    confidence DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Faces Reconhecidas
CREATE TABLE IF NOT EXISTS recognized_faces (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    detected_at TIMESTAMP NOT NULL,
    face_encoding TEXT, -- Embedding da face
    person_id INTEGER, -- ID da pessoa cadastrada (se reconhecida)
    person_name VARCHAR(255),
    confidence DECIMAL(5,2),
    snapshot_path VARCHAR(500),
    is_authorized BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pessoas Cadastradas
CREATE TABLE IF NOT EXISTS persons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    face_encoding TEXT,
    photo_path VARCHAR(500),
    is_authorized BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Placas de Veículos (LPR)
CREATE TABLE IF NOT EXISTS license_plates (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE CASCADE,
    detected_at TIMESTAMP NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    country VARCHAR(10) DEFAULT 'BR',
    vehicle_type VARCHAR(50),
    confidence DECIMAL(5,2),
    snapshot_path VARCHAR(500),
    is_authorized BOOLEAN,
    is_blacklisted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Placas Autorizadas
CREATE TABLE IF NOT EXISTS authorized_plates (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    country VARCHAR(10) DEFAULT 'BR',
    owner_name VARCHAR(255),
    vehicle_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Evidence (Ocorrências)
CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    incident_type VARCHAR(100),
    incident_date TIMESTAMP,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Arquivos de Evidence
CREATE TABLE IF NOT EXISTS evidence_files (
    id SERIAL PRIMARY KEY,
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE,
    file_type VARCHAR(50), -- 'video', 'image', 'document'
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relacionamento Evidence com Recordings
CREATE TABLE IF NOT EXISTS evidence_recordings (
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE,
    recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    PRIMARY KEY (evidence_id, recording_id)
);

-- Tabela de Log de Eventos
CREATE TABLE IF NOT EXISTS event_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    source_module VARCHAR(50), -- 'motion', 'dva', 'lpr', 'face', 'external'
    camera_id INTEGER REFERENCES cameras(id) ON DELETE SET NULL,
    severity VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    message TEXT NOT NULL,
    metadata JSONB,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Regras de Automação
CREATE TABLE IF NOT EXISTS automation_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event_type VARCHAR(100) NOT NULL,
    trigger_conditions JSONB, -- Condições específicas do trigger
    actions JSONB NOT NULL, -- Array de ações a executar
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Execução de Regras
CREATE TABLE IF NOT EXISTS automation_executions (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES automation_rules(id) ON DELETE CASCADE,
    triggered_by_event_id INTEGER REFERENCES event_logs(id),
    execution_status VARCHAR(50), -- 'success', 'failed', 'partial'
    execution_result JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_recordings_camera_time ON recordings(camera_id, start_time);
CREATE INDEX IF NOT EXISTS idx_event_logs_type_time ON event_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_event_logs_acknowledged ON event_logs(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_motion_detections_camera_time ON motion_detections(camera_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_license_plates_number ON license_plates(plate_number);
CREATE INDEX IF NOT EXISTS idx_license_plates_detected_at ON license_plates(detected_at);
CREATE INDEX IF NOT EXISTS idx_recognized_faces_camera_time ON recognized_faces(camera_id, detected_at);

