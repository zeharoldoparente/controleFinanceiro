-- ============================================================
-- SISTEMA DE CONTROLE FINANCEIRO
-- Banco de Dados MySQL 8.0+
-- Autor: José Aroldo Soares Bezerra / NASAM Dev.
-- Atualizado: Março 2026
-- ============================================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS controle_financeiro
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE controle_financeiro;

-- ============================================================
-- TABELA: users
-- Descrição: Usuários do sistema
-- ============================================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt da senha',
  tipo_plano ENUM('free', 'premium') DEFAULT 'free',
  email_verificado BOOLEAN DEFAULT FALSE,
  telefone VARCHAR(20) DEFAULT NULL,
  foto_url LONGTEXT DEFAULT NULL COMMENT 'Foto de perfil em base64',
  preferencia_moeda VARCHAR(10) DEFAULT 'BRL',
  preferencia_data VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  notificacoes_email TINYINT(1) DEFAULT 1,
  reset_token VARCHAR(255) DEFAULT NULL COMMENT 'Token para recuperação de senha via conta',
  reset_token_expira DATETIME DEFAULT NULL,
  email_novo_pendente VARCHAR(255) DEFAULT NULL COMMENT 'Novo email aguardando confirmação',
  email_token VARCHAR(255) DEFAULT NULL COMMENT 'Token de confirmação de troca de email',
  email_token_expira DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_tipo_plano (tipo_plano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: tokens_verificacao
-- Descrição: Tokens para verificação de email e recuperação de senha
-- ============================================================
CREATE TABLE tokens_verificacao (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  tipo ENUM('verificacao_email', 'recuperacao_senha') NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  expira_em DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_tipo (user_id, tipo),
  INDEX idx_expira_em (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: mesas
-- Descrição: Mesas de controle financeiro
-- ============================================================
CREATE TABLE mesas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  criador_id INT NOT NULL COMMENT 'Usuário que criou a mesa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (criador_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_criador (criador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: mesa_usuarios
-- Descrição: Relacionamento entre usuários e mesas (N:N)
-- ============================================================
CREATE TABLE mesa_usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mesa_id INT NOT NULL,
  user_id INT NOT NULL,
  papel ENUM('criador', 'convidado') NOT NULL DEFAULT 'convidado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_mesa_user (mesa_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_mesa_id (mesa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: categorias
-- Descrição: Categorias de receitas e despesas
-- ============================================================
CREATE TABLE categorias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  tipo ENUM('receita', 'despesa') NOT NULL,
  user_id INT DEFAULT NULL COMMENT 'NULL = padrao global; preenchido = personalizada do usuario',
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_categorias_user_id (user_id),
  INDEX idx_categorias_nome_tipo_user (nome, tipo, user_id),
  INDEX idx_tipo (tipo),
  INDEX idx_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: bandeiras
-- Descrição: Bandeiras de cartão (Visa, Mastercard, etc)
-- ============================================================
CREATE TABLE bandeiras (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL UNIQUE,
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: tipos_pagamento
-- Descrição: Tipos de pagamento (Cartão de Crédito, Pix, etc)
-- ============================================================
CREATE TABLE tipos_pagamento (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  user_id INT DEFAULT NULL COMMENT 'NULL = padrao global; preenchido = personalizado do usuario',
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tipos_pagamento_nome (nome),
  INDEX idx_tipos_pagamento_user_id (user_id),
  INDEX idx_tipos_pagamento_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: cartoes
-- Descrição: Cartões de crédito e débito dos usuários
-- ============================================================
CREATE TABLE cartoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL COMMENT 'Nome identificador do cartão (ex: Nubank Roxinho)',
  bandeira_id INT NOT NULL,
  tipo_pagamento_id INT NOT NULL COMMENT 'FK para tipos_pagamento (Crédito ou Débito)',
  limite_real DECIMAL(10, 2) DEFAULT NULL COMMENT 'Limite real do cartão (do banco)',
  limite_pessoal DECIMAL(10, 2) DEFAULT NULL COMMENT 'Limite pessoal (meta do usuário)',
  dia_fechamento INT DEFAULT NULL COMMENT 'Dia do fechamento da fatura (1-31)',
  dia_vencimento INT DEFAULT NULL COMMENT 'Dia do vencimento da fatura (1-31)',
  cor VARCHAR(7) DEFAULT '#8B5CF6' COMMENT 'Cor do cartão em hexadecimal',
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bandeira_id) REFERENCES bandeiras(id),
  FOREIGN KEY (tipo_pagamento_id) REFERENCES tipos_pagamento(id),
  INDEX idx_user_id (user_id),
  INDEX idx_bandeira (bandeira_id),
  INDEX idx_tipo_pagamento (tipo_pagamento_id),
  INDEX idx_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: faturas
-- Descrição: Faturas mensais dos cartões de crédito
-- ============================================================
CREATE TABLE faturas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cartao_id INT NOT NULL,
  mesa_id INT NOT NULL,
  mes_referencia DATE NOT NULL COMMENT 'Primeiro dia do mês de referência (ex: 2026-03-01)',
  data_fechamento DATE NOT NULL COMMENT 'Data do fechamento da fatura',
  data_vencimento DATE NOT NULL COMMENT 'Data do vencimento da fatura',
  valor_total DECIMAL(10, 2) DEFAULT 0.00,
  valor_pago DECIMAL(10, 2) DEFAULT NULL COMMENT 'Valor efetivamente pago',
  data_pagamento DATE DEFAULT NULL,
  status ENUM('aberta', 'fechada', 'paga') DEFAULT 'aberta',
  ativa TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (cartao_id) REFERENCES cartoes(id),
  FOREIGN KEY (mesa_id) REFERENCES mesas(id),
  UNIQUE KEY uniq_fatura (cartao_id, mesa_id, mes_referencia),
  INDEX idx_cartao (cartao_id),
  INDEX idx_mesa (mesa_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: receitas
-- Descrição: Receitas financeiras das mesas
-- ============================================================
CREATE TABLE receitas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mesa_id INT NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL COMMENT 'Valor provisionado (estimado)',
  data_recebimento DATE NOT NULL,
  categoria_id INT DEFAULT NULL,
  tipo_pagamento_id INT DEFAULT NULL,
  recorrente BOOLEAN DEFAULT FALSE COMMENT 'Se se repete todo mês automaticamente',
  status ENUM('a_receber', 'recebida') NOT NULL DEFAULT 'a_receber',
  valor_real DECIMAL(10, 2) DEFAULT NULL COMMENT 'Valor efetivamente recebido',
  data_confirmacao DATE DEFAULT NULL COMMENT 'Data em que foi confirmado o recebimento',
  comprovante VARCHAR(255) DEFAULT NULL COMMENT 'Nome do arquivo de comprovante',
  redistribuicao_json TEXT DEFAULT NULL COMMENT 'Historico da redistribuicao aplicada em recebimentos parciais',
  parcelas INT NOT NULL DEFAULT 1,
  parcela_atual INT NOT NULL DEFAULT 1,
  grupo_parcela VARCHAR(36) DEFAULT NULL COMMENT 'UUID para agrupar parcelas de uma mesma receita',
  origem_recorrente_id INT DEFAULT NULL COMMENT 'ID da receita recorrente mãe (para confirmações mensais)',
  mes_referencia VARCHAR(7) DEFAULT NULL COMMENT 'YYYY-MM do mês confirmado (para recorrentes)',
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (tipo_pagamento_id) REFERENCES tipos_pagamento(id) ON DELETE SET NULL,
  INDEX idx_mesa_id (mesa_id),
  INDEX idx_data_recebimento (data_recebimento),
  INDEX idx_categoria_id (categoria_id),
  INDEX idx_tipo_pagamento (tipo_pagamento_id),
  INDEX idx_status (status),
  INDEX idx_grupo_parcela (grupo_parcela),
  INDEX idx_origem_recorrente (origem_recorrente_id),
  INDEX idx_mes_referencia (mes_referencia),
  INDEX idx_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: despesas
-- Descrição: Despesas financeiras das mesas (tabela mais complexa)
-- ============================================================
CREATE TABLE despesas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mesa_id INT NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  tipo ENUM('variavel', 'fixa', 'assinatura') NOT NULL DEFAULT 'variavel' COMMENT 'Variável=pontual, Fixa=recorrente, Assinatura=serviço mensal',
  valor_provisionado DECIMAL(10, 2) NOT NULL COMMENT 'Valor estimado/previsto',
  valor_real DECIMAL(10, 2) DEFAULT NULL COMMENT 'Valor realmente pago',
  data_vencimento DATE NOT NULL,
  paga BOOLEAN DEFAULT FALSE,
  data_pagamento DATE DEFAULT NULL,
  comprovante VARCHAR(255) DEFAULT NULL COMMENT 'Nome do arquivo de comprovante',
  categoria_id INT DEFAULT NULL,
  tipo_pagamento_id INT DEFAULT NULL,
  cartao_id INT DEFAULT NULL,
  fatura_id INT DEFAULT NULL COMMENT 'FK para a fatura do cartão (se for despesa de crédito)',
  recorrente BOOLEAN DEFAULT FALSE COMMENT 'Despesa recorrente (fixa/assinatura)',
  data_cancelamento DATE DEFAULT NULL COMMENT 'Para recorrentes: a partir desta data, para de aparecer',
  ativa BOOLEAN DEFAULT TRUE,
  parcelas INT DEFAULT NULL COMMENT 'Número total de parcelas',
  parcela_atual INT DEFAULT NULL COMMENT 'Parcela atual (1, 2, 3...)',
  parcela_grupo_id VARCHAR(36) DEFAULT NULL COMMENT 'UUID para agrupar parcelas de uma mesma compra',
  origem_recorrente_id INT DEFAULT NULL COMMENT 'ID da despesa recorrente mÃ£e (para confirmaÃ§Ãµes mensais)',
  mes_referencia VARCHAR(7) DEFAULT NULL COMMENT 'YYYY-MM do mÃªs pago (para recorrentes)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (tipo_pagamento_id) REFERENCES tipos_pagamento(id) ON DELETE SET NULL,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL,
  FOREIGN KEY (fatura_id) REFERENCES faturas(id) ON DELETE SET NULL,
  INDEX idx_mesa_id (mesa_id),
  INDEX idx_data_vencimento (data_vencimento),
  INDEX idx_paga (paga),
  INDEX idx_categoria_id (categoria_id),
  INDEX idx_tipo_pagamento (tipo_pagamento_id),
  INDEX idx_cartao (cartao_id),
  INDEX idx_fatura (fatura_id),
  INDEX idx_recorrente (recorrente),
  INDEX idx_cancelamento (data_cancelamento),
  INDEX idx_ativa (ativa),
  INDEX idx_parcela_grupo (parcela_grupo_id),
  INDEX idx_origem_recorrente (origem_recorrente_id),
  INDEX idx_mes_referencia (mes_referencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: convites
-- Descrição: Convites para participar de mesas
-- ============================================================
CREATE TABLE convites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mesa_id INT NOT NULL,
  email_convidado VARCHAR(255) NOT NULL,
  convidado_por INT NOT NULL COMMENT 'ID do usuário que enviou o convite',
  status ENUM('pendente', 'aceito', 'recusado', 'expirado') DEFAULT 'pendente',
  token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Token único para aceitar/recusar',
  expira_em DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (convidado_por) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_email_convidado (email_convidado),
  INDEX idx_status (status),
  INDEX idx_mesa_id (mesa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: notificacoes
-- Descrição: Sistema de notificações ("sininho")
-- ============================================================
CREATE TABLE notificacoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tipo ENUM('convite_mesa', 'sistema', 'alerta_financeiro', 'outros') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  link VARCHAR(500) DEFAULT NULL COMMENT 'Link de ação (ex: /convites/token)',
  dados_extras JSON DEFAULT NULL COMMENT 'Dados adicionais em formato JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_lida (lida),
  INDEX idx_tipo (tipo),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: ian_planos
-- Descricao: Plano ativo e acompanhamento persistido do IAn por mesa compartilhada
-- ============================================================
CREATE TABLE ian_planos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  mesa_id INT NOT NULL,
  objetivo_descricao VARCHAR(500) NOT NULL,
  estrategia_id VARCHAR(30) NOT NULL,
  plano_json LONGTEXT NOT NULL,
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  INDEX idx_ian_planos_user_mesa_ativo (user_id, mesa_id, ativo),
  INDEX idx_ian_planos_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DADOS INICIAIS
-- Categorias padrão para facilitar o uso inicial
-- ============================================================

INSERT INTO categorias (nome, tipo) VALUES
-- Categorias de Receita
('Salário', 'receita'),
('Freelance', 'receita'),
('Investimentos', 'receita'),
('Outros Ganhos', 'receita'),
-- Categorias de Despesa
('Alimentação', 'despesa'),
('Transporte', 'despesa'),
('Moradia', 'despesa'),
('Saúde', 'despesa'),
('Educação', 'despesa'),
('Lazer', 'despesa'),
('Vestuário', 'despesa'),
('Outros Gastos', 'despesa');

-- ============================================================
-- BANDEIRAS PADRÃO
-- ============================================================

INSERT INTO bandeiras (nome, ativa) VALUES
('Visa', TRUE),
('Mastercard', TRUE),
('Elo', TRUE),
('American Express', TRUE),
('Hipercard', TRUE);

-- ============================================================
-- TIPOS DE PAGAMENTO PADRÃO
-- ============================================================

INSERT INTO tipos_pagamento (nome, ativa) VALUES
('Cartão de Crédito', TRUE),
('Cartão de Débito', TRUE),
('Pix', TRUE),
('Dinheiro', TRUE),
('Boleto', TRUE),
('Transferência Bancária', TRUE);

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- Verificar todas as tabelas criadas
SHOW TABLES;

-- Verificar estrutura completa
SELECT
    TABLE_NAME AS 'Tabela',
    TABLE_ROWS AS 'Linhas',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Tamanho (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'controle_financeiro'
ORDER BY TABLE_NAME;
