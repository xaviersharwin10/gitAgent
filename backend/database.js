const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS agents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          repo_url TEXT NOT NULL,
          branch_name TEXT NOT NULL,
          branch_hash TEXT NOT NULL UNIQUE,
          agent_address TEXT,
          status TEXT DEFAULT 'deploying',
          pid INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS secrets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id INTEGER NOT NULL,
          key TEXT NOT NULL,
          encrypted_value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) return reject(err);
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id INTEGER NOT NULL,
          decision TEXT NOT NULL,
          price REAL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          trade_executed BOOLEAN DEFAULT 0,
          trade_tx_hash TEXT,
          trade_amount REAL,
          FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) return reject(err);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_agents_branch_hash ON agents(branch_hash)
      `, (err) => {
        if (err) return reject(err);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_secrets_agent_id ON secrets(agent_id)
      `, (err) => {
        if (err) return reject(err);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_metrics_agent_id ON metrics(agent_id)
      `, (err) => {
        if (err) return reject(err);
      });

      resolve();
    });
  });
}

function getAgentByBranchHash(branch_hash) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function createAgent(agent) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [agent.repo_url, agent.branch_name, agent.branch_hash, agent.agent_address, agent.status || 'deploying'],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function updateAgent(agentId, updates) {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(agentId);
    
    db.run(
      `UPDATE agents SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

function getAllAgents(repo_url = null) {
  return new Promise((resolve, reject) => {
    if (repo_url) {
      db.all('SELECT * FROM agents WHERE repo_url = ? ORDER BY created_at DESC', [repo_url], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    } else {
      db.all('SELECT * FROM agents ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    }
  });
}

function saveSecret(agentId, key, encryptedValue) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO secrets (agent_id, key, encrypted_value, updated_at)
       SELECT ?, ?, ?, CURRENT_TIMESTAMP
       WHERE EXISTS (SELECT 1 FROM agents WHERE id = ?)
       UNION ALL
       SELECT ?, ?, ?, CURRENT_TIMESTAMP
       WHERE NOT EXISTS (SELECT 1 FROM secrets WHERE agent_id = ? AND key = ?)`,
      [agentId, key, encryptedValue, agentId, agentId, key, encryptedValue, agentId, key],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function getSecretsForAgent(agentId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT key, encrypted_value FROM secrets WHERE agent_id = ?', [agentId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function saveMetric(agentId, metric) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO metrics (agent_id, decision, price, trade_executed, trade_tx_hash, trade_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        agentId,
        metric.decision,
        metric.price || null,
        metric.trade_executed ? 1 : 0,
        metric.trade_tx_hash || null,
        metric.trade_amount || null
      ],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function getMetricsForAgent(agentId, limit = 100) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM metrics WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?',
      [agentId, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

function getAgentStats(agentId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
        COUNT(*) as total_decisions,
        SUM(CASE WHEN decision LIKE 'BUY%' THEN 1 ELSE 0 END) as buy_count,
        SUM(CASE WHEN decision LIKE 'HOLD%' THEN 1 ELSE 0 END) as hold_count,
        SUM(CASE WHEN trade_executed = 1 THEN 1 ELSE 0 END) as trades_executed,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM metrics
      WHERE agent_id = ?`,
      [agentId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || {});
      }
    );
  });
}

module.exports = {
  db,
  initializeDatabase,
  getAgentByBranchHash,
  createAgent,
  updateAgent,
  getAllAgents,
  saveSecret,
  getSecretsForAgent,
  saveMetric,
  getMetricsForAgent,
  getAgentStats
};

