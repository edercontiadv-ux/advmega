-- Criação da tabela publications
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_number TEXT NOT NULL,
    parties TEXT NOT NULL,
    publication_date DATE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    raw_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criação de índices para otimização de buscas
CREATE INDEX idx_publications_process_number ON publications(process_number);
CREATE INDEX idx_publications_is_read ON publications(is_read);
CREATE INDEX idx_publications_publication_date ON publications(publication_date DESC);

-- Criação da tabela execution_logs
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL, -- 'success' | 'error'
    publications_found INT NOT NULL DEFAULT 0,
    publications_new INT NOT NULL DEFAULT 0,
    error_message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_execution_logs_executed_at ON execution_logs(executed_at DESC);
