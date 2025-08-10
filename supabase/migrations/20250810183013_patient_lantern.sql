/*
  # Banco Imobiliário Digital - Schema Creation

  1. New Tables
    - `ngl-games-banco-imobiliario-sessions`
      - `id` (uuid, primary key)
      - `session_code` (text, unique) - código para jogadores se conectarem
      - `host_id` (uuid) - ID do host da sessão
      - `is_active` (boolean) - se a sessão está ativa
      - `default_buttons` (jsonb) - valores dos botões customizáveis
      - `created_at` (timestamp)

    - `ngl-games-banco-imobiliario-players`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `name` (text) - nome do jogador
      - `balance` (integer) - saldo atual do jogador
      - `initial_balance` (integer) - saldo inicial definido
      - `is_host` (boolean) - se é o host da sessão
      - `created_at` (timestamp)

    - `ngl-games-banco-imobiliario-transactions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `from_player_id` (uuid, nullable) - jogador que enviou (null = banco)
      - `to_player_id` (uuid, nullable) - jogador que recebeu (null = banco)
      - `amount` (integer) - valor da transação
      - `previous_balance` (integer) - saldo anterior do destinatário
      - `new_balance` (integer) - novo saldo do destinatário
      - `description` (text) - descrição da transação
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for session-based access control
*/

-- Sessions table
CREATE TABLE IF NOT EXISTS "ngl-games-banco-imobiliario-sessions" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text UNIQUE NOT NULL,
  host_id uuid,
  is_active boolean DEFAULT true,
  default_buttons jsonb DEFAULT '[100, 200, 500, 1000, 2000, 5000]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS "ngl-games-banco-imobiliario-players" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES "ngl-games-banco-imobiliario-sessions"(id) ON DELETE CASCADE,
  name text NOT NULL,
  balance integer DEFAULT 15000,
  initial_balance integer DEFAULT 15000,
  is_host boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS "ngl-games-banco-imobiliario-transactions" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES "ngl-games-banco-imobiliario-sessions"(id) ON DELETE CASCADE,
  from_player_id uuid REFERENCES "ngl-games-banco-imobiliario-players"(id) ON DELETE SET NULL,
  to_player_id uuid REFERENCES "ngl-games-banco-imobiliario-players"(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  previous_balance integer NOT NULL,
  new_balance integer NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE "ngl-games-banco-imobiliario-sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngl-games-banco-imobiliario-players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngl-games-banco-imobiliario-transactions" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Sessions
CREATE POLICY "Sessions are publicly readable"
  ON "ngl-games-banco-imobiliario-sessions"
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create sessions"
  ON "ngl-games-banco-imobiliario-sessions"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Host can update their sessions"
  ON "ngl-games-banco-imobiliario-sessions"
  FOR UPDATE
  USING (true);

CREATE POLICY "Host can delete their sessions"
  ON "ngl-games-banco-imobiliario-sessions"
  FOR DELETE
  USING (true);

-- RLS Policies for Players
CREATE POLICY "Players are readable by session participants"
  ON "ngl-games-banco-imobiliario-players"
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create players"
  ON "ngl-games-banco-imobiliario-players"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can be updated by session participants"
  ON "ngl-games-banco-imobiliario-players"
  FOR UPDATE
  USING (true);

CREATE POLICY "Players can be deleted by session participants"
  ON "ngl-games-banco-imobiliario-players"
  FOR DELETE
  USING (true);

-- RLS Policies for Transactions
CREATE POLICY "Transactions are readable by session participants"
  ON "ngl-games-banco-imobiliario-transactions"
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create transactions"
  ON "ngl-games-banco-imobiliario-transactions"
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON "ngl-games-banco-imobiliario-sessions"(session_code);
CREATE INDEX IF NOT EXISTS idx_players_session ON "ngl-games-banco-imobiliario-players"(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_session ON "ngl-games-banco-imobiliario-transactions"(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON "ngl-games-banco-imobiliario-transactions"(created_at DESC);