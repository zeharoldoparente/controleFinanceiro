-- ============================================================
-- SISTEMA DE CONTROLE FINANCEIRO
-- Banco de Dados MySQL 8.0+
-- Autor: José Aroldo Soares
-- Data: Fevereiro 2026
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
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
  papel ENUM('criador', 'convidado') NOT NULL,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: formas_pagamento
-- Descrição: Formas de pagamento (PIX, Dinheiro, etc)
-- ============================================================
CREATE TABLE formas_pagamento (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: cartoes
-- Descrição: Cartões de crédito e débito dos usuários
-- ============================================================
CREATE TABLE cartoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL COMMENT 'Nome identificador do cartão',
  bandeira VARCHAR(100) NOT NULL COMMENT 'Visa, Mastercard, etc',
  limite DECIMAL(10, 2) DEFAULT NULL COMMENT 'Limite do cartão (geralmente para crédito)',
  dia_vencimento INT NOT NULL COMMENT 'Dia do vencimento da fatura (1-31)',
  tipo ENUM('credito', 'debito') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: receitas
-- Descrição: Receitas financeiras das mesas
-- ============================================================
CREATE TABLE receitas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mesa_id INT NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_recebimento DATE NOT NULL,
  categoria_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  INDEX idx_mesa_id (mesa_id),
  INDEX idx_data_recebimento (data_recebimento),
  INDEX idx_categoria_id (categoria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: despesas
-- Descrição: Despesas financeiras das mesas (tabela mais complexa)
-- ============================================================
CREATE TABLE despesas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mesa_id INT NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  valor_provisionado DECIMAL(10, 2) NOT NULL COMMENT 'Valor estimado/previsto',
  valor_real DECIMAL(10, 2) DEFAULT NULL COMMENT 'Valor realmente pago',
  data_vencimento DATE NOT NULL,
  paga BOOLEAN DEFAULT FALSE,
  data_pagamento DATE DEFAULT NULL,
  comprovante VARCHAR(255) DEFAULT NULL COMMENT 'Nome do arquivo de comprovante',
  categoria_id INT DEFAULT NULL,
  forma_pagamento_id INT DEFAULT NULL,
  cartao_id INT DEFAULT NULL,
  recorrente BOOLEAN DEFAULT FALSE COMMENT 'Despesa recorrente (mensalidade)',
  parcelas INT DEFAULT NULL COMMENT 'Número total de parcelas',
  parcela_atual INT DEFAULT NULL COMMENT 'Parcela atual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (forma_pagamento_id) REFERENCES formas_pagamento(id) ON DELETE SET NULL,
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL,
  INDEX idx_mesa_id (mesa_id),
  INDEX idx_data_vencimento (data_vencimento),
  INDEX idx_paga (paga),
  INDEX idx_categoria_id (categoria_id),
  INDEX idx_recorrente (recorrente)
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
  tipo ENUM('convite_mesa', 'sistema', 'outros') NOT NULL,
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
-- DADOS INICIAIS (OPCIONAL)
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
-- FORMAS DE PAGAMENTO PADRÃO
-- ============================================================

INSERT INTO formas_pagamento (nome) VALUES
('PIX'),
('Dinheiro'),
('Débito'),
('Crédito'),
('Transferência Bancária'),
('Boleto');

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- Verificar todas as tabelas criadas
SHOW TABLES;

-- Verificar estrutura completa
SELECT 
    TABLE_NAME as 'Tabela',
    TABLE_ROWS as 'Linhas',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Tamanho (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'controle_financeiro'
ORDER BY TABLE_NAME;