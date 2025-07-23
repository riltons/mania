-- Migração para suporte a pagamentos via Play Store
-- Criação de tabela para armazenar assinaturas e períodos de trial

-- Criar enum para status da assinatura (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'trial');
    END IF;
END$$;

-- Criar enum para plataforma de pagamento (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_platform') THEN
        CREATE TYPE payment_platform AS ENUM ('android', 'ios', 'web');
    END IF;
END$$;

-- Tabela de assinaturas (se não existir)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  purchase_token TEXT,
  platform payment_platform NOT NULL DEFAULT 'android',
  
  -- Índices para consultas comuns
  CONSTRAINT idx_subscriptions_user_id_unique UNIQUE (user_id, status)
);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover o trigger se já existir
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Criar o trigger para atualizar o timestamp de updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON subscriptions;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias assinaturas" ON subscriptions;
DROP POLICY IF EXISTS "Service role pode acessar todas as assinaturas" ON subscriptions;

-- Política para usuários verem apenas suas próprias assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Política para usuários atualizarem apenas suas próprias assinaturas
CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
ON subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para permitir inserção de assinaturas pelo próprio usuário
CREATE POLICY "Usuários podem inserir suas próprias assinaturas"
ON subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que o serviço de backend acesse todas as assinaturas
CREATE POLICY "Service role pode acessar todas as assinaturas"
ON subscriptions
FOR ALL
USING (auth.role() = 'service_role');

-- Função para verificar se uma assinatura está ativa
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM subscriptions
  WHERE user_id = user_uuid 
  AND (
    (status = 'active') OR
    (status = 'trial' AND (ends_at IS NULL OR ends_at > NOW()))
  );
  
  RETURN active_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Função para obter dias restantes de uma assinatura
CREATE OR REPLACE FUNCTION get_subscription_remaining_days(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  remaining INTEGER;
  end_date TIMESTAMPTZ;
BEGIN
  SELECT ends_at INTO end_date
  FROM subscriptions
  WHERE user_id = user_uuid
  AND (status = 'active' OR status = 'trial')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF end_date IS NULL THEN
    RETURN NULL;
  ELSE
    SELECT EXTRACT(DAY FROM (end_date - NOW()))::INTEGER INTO remaining;
    RETURN GREATEST(0, remaining);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Remover view se existir
DROP VIEW IF EXISTS subscription_details;

-- Criar view para facilitar consultas de assinaturas com informações do usuário
CREATE OR REPLACE VIEW subscription_details AS
SELECT 
  s.id,
  s.user_id,
  s.plan_id,
  s.status,
  s.created_at,
  s.updated_at,
  s.ends_at,
  s.canceled_at,
  s.platform,
  u.email as user_email,
  up.full_name as user_name,
  get_subscription_remaining_days(s.user_id) as remaining_days
FROM 
  subscriptions s
JOIN 
  auth.users u ON s.user_id = u.id
LEFT JOIN 
  user_profiles up ON s.user_id = up.user_id;

-- Conceder permissões à role authenticated
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION is_subscription_active TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_remaining_days TO authenticated;
GRANT SELECT ON subscription_details TO authenticated;

-- Conceder permissões à role anon para funções específicas
GRANT EXECUTE ON FUNCTION is_subscription_active TO anon;
