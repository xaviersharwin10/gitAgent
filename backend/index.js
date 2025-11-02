require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const SimpleCrypto = require('simple-crypto-js').default;
const pm2 = require('pm2');
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const {
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
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase().then(() => {
  console.log('✅ Database initialized');
}).catch(err => {
  console.error('❌ Database initialization error:', err);
});

// Initialize crypto for secrets
const masterSecretKey = process.env.MASTER_SECRET_KEY || 'default-secret-key-change-me';
const crypto = new SimpleCrypto(masterSecretKey);

// Lazy Ethers setup (only when needed)
let provider = null;
let wallet = null;
let factoryContract = null;

function getEthersSetup() {
  if (!provider) {
    try {
      const rpcUrl = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';
      provider = new ethers.JsonRpcProvider(rpcUrl);
      console.log(`✅ Connected to Somnia RPC: ${rpcUrl}`);
    } catch (error) {
      console.error('❌ Failed to initialize Ethers provider:', error.message);
      return { provider: null, wallet: null, factoryContract: null };
    }
  }

  if (!wallet && process.env.BACKEND_PRIVATE_KEY) {
    try {
      wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);
      console.log(`✅ Wallet initialized: ${wallet.address}`);
    } catch (error) {
      console.error('❌ Failed to initialize wallet:', error.message);
    }
  }

  if (!factoryContract && wallet && process.env.AGENT_FACTORY_ADDRESS) {
    try {
      const factoryABI = [
        "function agents(bytes32) public view returns (address)",
        "function registerAgent(bytes32) public returns (address)",
        "event AgentRegistered(address indexed owner, bytes32 indexed branchHash, address agentAddress)"
      ];
      factoryContract = new ethers.Contract(process.env.AGENT_FACTORY_ADDRESS, factoryABI, wallet);
      console.log(`✅ Factory contract initialized: ${process.env.AGENT_FACTORY_ADDRESS}`);
    } catch (error) {
      console.error('❌ Failed to initialize factory contract:', error.message);
    }
  }

  return { provider, wallet, factoryContract };
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GitHub Webhook Handler
app.post('/webhook/github', async (req, res) => {
  // Respond immediately to prevent timeout
  res.status(200).json({ message: 'Webhook received, processing...' });

  // Process asynchronously
  (async () => {
    try {
      if (!req.body.repository || !req.body.ref) {
        console.error('❌ Invalid webhook payload: missing repository or ref');
        return;
      }

      const repoUrl = req.body.repository.clone_url;
      const branchName = req.body.ref.replace('refs/heads/', '');

      if (!repoUrl || !branchName) {
        console.error('❌ Invalid webhook payload: missing repo_url or branch_name');
        return;
      }

      console.log(`📥 Webhook received: ${repoUrl} - branch: ${branchName}`);

      // Calculate branch_hash (same as CLI)
      const branch_hash = ethers.id(repoUrl + "/" + branchName);
      console.log(`🔑 Branch hash: ${branch_hash}`);

      // Check blockchain for existing agent
      const { factoryContract } = getEthersSetup();
      let agentAddress = null;

      if (factoryContract) {
        try {
          agentAddress = await factoryContract.agents(branch_hash);
          if (agentAddress && agentAddress !== ethers.ZeroAddress) {
            console.log(`✅ Found existing agent on-chain: ${agentAddress}`);
          }
        } catch (error) {
          console.warn('⚠️ Could not check blockchain, will deploy new agent:', error.message);
        }
      }

      // Check database
      let agent = await getAgentByBranchHash(branch_hash);
      let isNewAgent = !agent;

      if (isNewAgent) {
        // If agent exists on-chain but not in DB, recover
        if (agentAddress && agentAddress !== ethers.ZeroAddress) {
          console.log('🔄 Recovering agent from blockchain to database...');
          agent = {
            id: await createAgent({
              repo_url: repoUrl,
              branch_name: branchName,
              branch_hash: branch_hash,
              agent_address: agentAddress,
              status: 'deployed'
            }),
            repo_url: repoUrl,
            branch_name: branchName,
            branch_hash: branch_hash,
            agent_address: agentAddress,
            status: 'deployed'
          };
        } else {
          // Deploy new agent contract
          if (factoryContract && wallet) {
            console.log('🚀 Deploying new agent contract...');
            try {
              const tx = await factoryContract.registerAgent(branch_hash);
              console.log(`📤 Transaction sent: ${tx.hash}`);
              const receipt = await tx.wait();
              console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
              
              // Wait a bit for state propagation
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              agentAddress = await factoryContract.agents(branch_hash);
              if (!agentAddress || agentAddress === ethers.ZeroAddress) {
                throw new Error('Agent address not found after registration');
              }
              console.log(`✅ Agent deployed: ${agentAddress}`);
            } catch (error) {
              console.error('❌ Failed to deploy agent contract:', error.message);
              return;
            }
          } else {
            console.warn('⚠️ Factory contract not available, skipping blockchain deployment');
          }

          // Create database entry
          agent = {
            id: await createAgent({
              repo_url: repoUrl,
              branch_name: branchName,
              branch_hash: branch_hash,
              agent_address: agentAddress,
              status: 'deploying'
            }),
            repo_url: repoUrl,
            branch_name: branchName,
            branch_hash: branch_hash,
            agent_address: agentAddress,
            status: 'deploying'
          };
        }
      } else {
        // Update existing agent
        if (agentAddress && agentAddress !== ethers.ZeroAddress) {
          await updateAgent(agent.id, {
            agent_address: agentAddress,
            repo_url: repoUrl,
            branch_name: branchName,
            status: 'updating'
          });
          agent.agent_address = agentAddress;
          agent.repo_url = repoUrl;
          agent.branch_name = branchName;
        }
      }

      // Clone or pull repository
      const agentsDir = path.join(__dirname, 'agents');
      if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir, { recursive: true });
      }

      const agentPath = path.join(agentsDir, branch_hash);

      if (!fs.existsSync(agentPath)) {
        console.log(`📥 Cloning repository to ${agentPath}...`);
        const cloneCmd = `git clone -b ${branchName} ${repoUrl} ${agentPath}`;
        if (shell.exec(cloneCmd).code !== 0) {
          console.error('❌ Failed to clone repository');
          await updateAgent(agent.id, { status: 'error' });
          return;
        }
        console.log('✅ Repository cloned');
      } else {
        console.log(`🔄 Pulling latest changes...`);
        shell.cd(agentPath);
        if (shell.exec('git pull').code !== 0) {
          console.error('❌ Failed to pull changes');
        } else {
          console.log('✅ Repository updated');
        }
      }

      // Install dependencies
      console.log('📦 Installing dependencies...');
      shell.cd(agentPath);
      if (shell.exec('npm install').code !== 0) {
        console.error('❌ Failed to install dependencies');
      } else {
        console.log('✅ Dependencies installed');
      }

      // Start or reload agent with PM2
      await startOrReloadAgent(agent, agentPath, branch_hash);
      console.log(`✅ Agent ${isNewAgent ? 'deployed' : 'updated'} successfully`);

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
    }
  })();
});

// Start or reload agent with PM2
async function startOrReloadAgent(agent, agentPath, branch_hash = null) {
  if (!branch_hash) {
    branch_hash = agent.branch_hash || ethers.id(agent.repo_url + "/" + agent.branch_name);
  }

  // Fetch and decrypt secrets
  const env = await new Promise((resolve, reject) => {
    const secrets = {
      AGENT_CONTRACT_ADDRESS: agent.agent_address,
      REPO_URL: agent.repo_url || '',
      BRANCH_NAME: agent.branch_name || 'main',
      BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3005}`,
      SOMNIA_RPC_URL: process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network',
    };

    if (agent.id) {
      getSecretsForAgent(agent.id).then(rows => {
        rows.forEach(row => {
          try {
            secrets[row.key] = crypto.decrypt(row.encrypted_value);
          } catch (err) {
            console.error(`Failed to decrypt secret ${row.key}:`, err.message);
          }
        });
        resolve(secrets);
      }).catch(reject);
    } else {
      resolve(secrets);
    }
  });

  // PM2 app configuration
  const pm2Name = branch_hash.replace('0x', '').substring(0, 16);
  
  const tsNodeBin = path.join(agentPath, 'node_modules', '.bin', 'ts-node');
  let tsNodePath = tsNodeBin;
  
  if (fs.existsSync(tsNodeBin)) {
    try {
      tsNodePath = fs.realpathSync(tsNodeBin);
    } catch (e) {
      tsNodePath = tsNodeBin;
    }
  } else {
    tsNodePath = 'ts-node';
  }
  
  const pm2App = {
    name: pm2Name,
    script: path.join(agentPath, 'agent.ts'),
    env: env,
    exec_mode: 'fork',
    interpreter: tsNodePath,
    cwd: agentPath,
  };

  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        console.error('PM2 connection failed:', err);
        return reject(err);
      }

      pm2.describe(pm2Name, (err, processes) => {
        if (err || !processes || processes.length === 0) {
          // Start new process
          pm2.start(pm2App, (err, apps) => {
            pm2.disconnect();
            if (err) {
              console.error('PM2 start failed:', err);
              return reject(err);
            }
            console.log(`✅ PM2 started: ${pm2Name}`);
            updateAgent(agent.id, { status: 'running', pid: apps[0].pid });
            resolve();
          });
        } else {
          // Delete and restart to ensure env vars are updated
          pm2.delete(pm2Name, (err) => {
            if (err) {
              console.error('PM2 delete failed:', err);
            }
            pm2.start(pm2App, (err, apps) => {
              pm2.disconnect();
              if (err) {
                console.error('PM2 restart failed:', err);
                return reject(err);
              }
              console.log(`✅ PM2 restarted: ${pm2Name}`);
              updateAgent(agent.id, { status: 'running', pid: apps[0].pid });
              resolve();
            });
          });
        }
      });
    });
  });
}

// API: Save secrets
app.post('/api/secrets', async (req, res) => {
  try {
    let { branch_hash, repo_url, branch_name, key, value } = req.body;
    
    // Calculate branch_hash if not provided (for backward compatibility)
    if (!branch_hash && repo_url && branch_name) {
      branch_hash = ethers.id(repo_url + "/" + branch_name);
    }
    
    if (!branch_hash || !key || !value) {
      return res.status(400).json({ error: 'Missing branch_hash (or repo_url+branch_name), key, or value' });
    }

    const agent = await getAgentByBranchHash(branch_hash);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const encryptedValue = crypto.encrypt(value);
    await saveSecret(agent.id, key, encryptedValue);

    res.json({ success: true, message: `Secret ${key} saved` });
  } catch (error) {
    console.error('Error saving secret:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get all agents
app.get('/api/agents', async (req, res) => {
  try {
    const repo_url = req.query.repo_url;
    const agents = await getAllAgents(repo_url);
    res.json({ agents });
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get agent by ID
app.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await getAgentByBranchHash(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ agent });
  } catch (error) {
    console.error('Error getting agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Restart agent
app.post('/api/agents/:branch_hash/restart', async (req, res) => {
  try {
    const branch_hash = req.params.branch_hash;
    const agent = await getAgentByBranchHash(branch_hash);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agentPath = path.join(__dirname, 'agents', branch_hash);
    if (!fs.existsSync(agentPath)) {
      console.error(`Agent directory not found: ${agentPath}`);
      return res.status(404).json({ error: `Agent directory not found: ${agentPath}` });
    }

    console.log(`🔄 Restarting agent ${branch_hash} from ${agentPath}`);
    await startOrReloadAgent(agent, agentPath, branch_hash);
    res.json({ success: true, message: 'Agent restarted' });
  } catch (error) {
    console.error('Error restarting agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save metrics
app.post('/api/metrics', async (req, res) => {
  try {
    let { branch_hash, repo_url, branch_name, decision, price, trade_executed, trade_tx_hash, trade_amount } = req.body;
    
    // Calculate branch_hash if not provided (for backward compatibility)
    if (!branch_hash && repo_url && branch_name) {
      branch_hash = ethers.id(repo_url + "/" + branch_name);
    }
    
    if (!branch_hash || !decision) {
      return res.status(400).json({ error: 'Missing branch_hash (or repo_url+branch_name) or decision' });
    }

    const agent = await getAgentByBranchHash(branch_hash);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await saveMetric(agent.id, {
      decision,
      price,
      trade_executed,
      trade_tx_hash,
      trade_amount
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving metric:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get metrics for agent
app.get('/api/metrics/:branch_hash', async (req, res) => {
  try {
    const agent = await getAgentByBranchHash(req.params.branch_hash);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const metrics = await getMetricsForAgent(agent.id, 100);
    res.json({ metrics });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get stats for agent
app.get('/api/stats/:branch_hash', async (req, res) => {
  try {
    const agent = await getAgentByBranchHash(req.params.branch_hash);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const stats = await getAgentStats(agent.id);
    res.json({ stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get logs for agent
app.get('/api/logs/:branch_hash', async (req, res) => {
  try {
    const agent = await getAgentByBranchHash(req.params.branch_hash);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const pm2Name = agent.branch_hash.replace('0x', '').substring(0, 16);
    const logPath = path.join(process.env.HOME || '/home/sharwin', '.pm2', 'logs', `${pm2Name}-out.log`);

    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-50);
      res.json({ logs });
    } else {
      // Try error log
      const errorLogPath = path.join(process.env.HOME || '/home/sharwin', '.pm2', 'logs', `${pm2Name}-error.log`);
      if (fs.existsSync(errorLogPath)) {
        const logs = fs.readFileSync(errorLogPath, 'utf8').split('\n').slice(-50);
        res.json({ logs });
      } else {
        res.json({ logs: ['No logs available yet'] });
      }
    }
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GitAgent Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📥 GitHub webhook: http://localhost:${PORT}/webhook/github`);
});

