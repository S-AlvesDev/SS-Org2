-- Schema para o Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

/**
  AVISO: Se você já criou as tabelas anteriormente e está recebendo erro de coluna faltando (ex: client_id),
  descomente as linhas abaixo (remova o --) para limpar o banco e recriar tudo do zero.
  ISSO IRÁ APAGAR TODOS OS DADOS EXISTENTES!
**/

-- DROP TABLE IF EXISTS wa_messages CASCADE;
-- DROP TABLE IF EXISTS wa_chats CASCADE;
-- DROP TABLE IF EXISTS update_logs CASCADE;
-- DROP TABLE IF EXISTS contracts CASCADE;
-- DROP TABLE IF EXISTS properties CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Tabela de Usuários (Administradores, Corretores, Clientes, Almoxarifado)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT,
    matricula TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    senha TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    matricula TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Imóveis
CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    valor DECIMAL NOT NULL,
    status TEXT DEFAULT 'DISPONÍVEL',
    localizacao TEXT,
    descricao TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nova Tabela de Materiais (Estoque)
CREATE TABLE IF NOT EXISTS materials (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    unidade_medida TEXT NOT NULL,
    qtd_volumes INTEGER NOT NULL DEFAULT 0,
    fator_multiplicador INTEGER NOT NULL DEFAULT 1,
    saldo_unidades INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nova Tabela de Histórico de Movimentação de Estoque
CREATE TABLE IF NOT EXISTS material_movements (
    id BIGSERIAL PRIMARY KEY,
    material_id BIGINT REFERENCES materials(id) ON DELETE CASCADE,
    tipo_operacao TEXT NOT NULL, -- ENTRADA, SAIDA, DEVOLUCAO
    quantidade INTEGER NOT NULL,
    funcionario_matricula TEXT NOT NULL,
    justificativa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comandos de ALTER TABLE para migração de quem já tem o BD rodando:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;


-- Tabela de Contratos
CREATE TABLE IF NOT EXISTS contracts (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id),
    property_id BIGINT REFERENCES properties(id),
    valor_imovel DECIMAL NOT NULL,
    valor_entrada DECIMAL NOT NULL,
    valor_financiado DECIMAL NOT NULL,
    taxa_juros DECIMAL NOT NULL,
    num_parcelas INTEGER NOT NULL,
    tipo_amortizacao TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    installments JSONB NOT NULL,
    status TEXT DEFAULT 'ATIVO',
    data_contrato TIMESTAMPTZ DEFAULT NOW(),
    distrato JSONB
);

-- Tabela de Logs de Atualização
CREATE TABLE IF NOT EXISTS update_logs (
    id BIGSERIAL PRIMARY KEY,
    tipo TEXT,
    descricao TEXT,
    data TIMESTAMPTZ DEFAULT NOW(),
    admin TEXT,
    taxa_antiga DECIMAL,
    taxa_nova DECIMAL,
    contrato_id BIGINT
);

-- Tabelas para Integração WhatsApp
CREATE TABLE IF NOT EXISTS wa_chats (
    id TEXT PRIMARY KEY,
    nome TEXT,
    telefone TEXT,
    interesse TEXT,
    status TEXT,
    atendente_id BIGINT,
    last_interaction BIGINT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wa_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id TEXT REFERENCES wa_chats(id) ON DELETE CASCADE,
    from_me BOOLEAN NOT NULL,
    text TEXT,
    media_url TEXT,
    media_type TEXT,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Imóveis Interessados (Leads)
CREATE TABLE IF NOT EXISTS imoveis_interessados (
    id BIGSERIAL PRIMARY KEY,
    imovel_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
    imovel_nome TEXT NOT NULL,
    imovel_valor DECIMAL,
    imovel_localizacao TEXT,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Opcional, desativado por padrão para este exemplo para facilitar a conexão server-side com Service Role Key)
-- Se quiser usar Anon Key, você precisará configurar as políticas (Policies) adequadamente.
