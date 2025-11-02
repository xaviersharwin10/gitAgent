# GitAgent: "Vercel for AI Agents"

**Track:** Infra Agents  
**One-Line Pitch:** A "zero-friction," Git-native deployment platform. `git push` is your deploy. `git branch` is your A/B test.

## The Problem

Deploying and managing AI agents is complex, manual, and high-friction. Developers face:
- **Manual Deployment**: Complex setup processes for each agent
- **No A/B Testing**: Difficult to test different agent strategies in parallel
- **Secret Management**: Insecure handling of API keys and credentials
- **Monitoring**: No unified way to track agent performance and logs
- **Scaling**: Hard to manage multiple agent versions and rollbacks

## The Solution

GitAgent solves this by mapping the agent lifecycle to the Git workflow, making AI agent deployment as simple as pushing code.

### Core Features

#### 🚀 `git push` to Deploy
- GitHub webhook triggers automatic agent deployment
- Clones your repository and runs your agent code
- Injects secrets securely as environment variables
- Manages agent lifecycle with PM2 process management

#### 🔄 `git branch` for A/B Testing
- Each branch deploys as a separate, parallel agent
- Compare performance between different strategies
- Easy rollbacks with `git revert`
- Collaborative development with team members

#### 🛠️ The `git somnia-agent` CLI
- `git somnia-agent init` - Initialize GitAgent in your repository
- `git somnia-agent secrets set GROQ_API_KEY=...` - Secure secret management
- `git somnia-agent stats` - Real-time agent performance metrics
- `git somnia-agent logs` - Live agent output and decisions
- `git somnia-agent compare main aggressive` - Side-by-side branch comparison

> **Setup:** Install with `npm install -g git-somnia-agent`, then run `git config --global alias.somnia-agent '!git-somnia-agent'` to enable `git somnia-agent` commands.

## Somnia Blockchain Integration ⛓️

**This is NOT just a webhook system. Every agent is a deployed smart contract on Somnia:**

1. **On-Chain Agent Registry** (`AgentFactory.sol`)
   - Deploys unique `Agent.sol` contracts for each repo/branch on Somnia testnet
   - Creates immutable, on-chain identity for each AI agent
   - Tracks all agents in a blockchain-backed registry

2. **Agent Smart Contracts** (`Agent.sol`)
   - Each agent is a deployed contract on Somnia with its own address
   - Agents can receive and hold SOMI tokens (ownable vault)
   - Can execute arbitrary calls to DEXs, DeFi protocols on Somnia
   - Immutable proof of deployment on-chain

3. **Somnia Testnet Deployment**
   - All contracts deployed to Somnia testnet (`chainId: 50312`)
   - Uses Somnia RPC (`https://dream-rpc.somnia.network`)
   - Agents interact with Somnia's DeFi ecosystem
   - **Network**: Somnia Testnet (Chain ID: 50312)

4. **Git → Blockchain → AI Pipeline**
   ```
   git push → GitHub webhook → Backend → Deploy Agent.sol on Somnia 
   → Clone code → Run AI agent → Agent can execute trades on Somnia DEXs
   ```

## Quick Start

### 1. Install CLI
```bash
npm install -g git-somnia-agent
git config --global alias.somnia-agent '!git-somnia-agent'
```

### 2. Initialize Repository
```bash
cd your-agent-repo
git somnia-agent init
git somnia-agent secrets set GROQ_API_KEY=your-key-here
```

### 3. Configure Webhook
- Go to GitHub → Repository Settings → Webhooks
- Add webhook: `https://somnia-git-agent.onrender.com/webhook/github`
- Events: Just the push event

### 4. Deploy
```bash
git push origin main
```

### 5. Monitor
```bash
git somnia-agent stats
git somnia-agent logs
git somnia-agent compare main feature-branch
```

## Live Dashboard

Access the live dashboard: **https://somnia-git-agent.onrender.com/dashboard**

## Architecture

```
Developer → git push
    ↓
GitHub Webhook → GitAgent Backend
    ↓
Deploy Agent.sol contract on Somnia Testnet
    ↓
Agent gets on-chain address (0x...)
    ↓
Clone code & inject secrets
    ↓
Run AI agent (PM2)
    ↓
Agent can execute trades/DeFi on Somnia via contract.execute()
```

## Tech Stack

- **Smart Contracts**: Solidity (Agent.sol, AgentFactory.sol)
- **Backend**: Node.js, Express, SQLite, PM2
- **Blockchain**: ethers.js, Somnia testnet
- **CLI**: Commander.js, Chalk, Inquirer
- **AI Integration**: Groq SDK, TypeScript
- **Deployment**: Render.com

## Project Structure

```
GitFi/
├── contracts/          # Solidity smart contracts
├── backend/           # Express server, webhook handler
├── git-agent-cli/     # CLI tool
├── agent-template/    # Agent starter template (separate repo)
└── dashboard/         # Frontend dashboard
```

## Why This Matters for Somnia

### 🎯 Infrastructure Track Fit
This is infrastructure that makes deploying Somnia agents **10x easier**. Before GitAgent:
- ❌ Manual contract deployment for each agent
- ❌ No way to track which agents are deployed
- ❌ Difficult to manage multiple agent versions
- ❌ No unified deployment workflow

After GitAgent:
- ✅ `git push` auto-deploys agents to Somnia
- ✅ On-chain registry tracks all agents
- ✅ Each branch = separate agent contract
- ✅ Production-ready deployment pipeline

### 🔗 Somnia-Specific Benefits
- **On-Chain Identity**: Every agent has a Somnia contract address
- **Token Management**: Agents can hold/receive SOMI tokens
- **DeFi Integration**: Agents can interact with Somnia DEXs/protocols
- **Blockchain-Backed**: Agent registry is immutable on Somnia
- **Recovery**: Can recover agent addresses even if backend is lost

### 💡 Real-World Use Cases
1. **DeFi Trading Agents**: Deploy trading bots that execute on Somnia DEXs
2. **A/B Testing Strategies**: Test different AI strategies as separate contracts
3. **Team Collaboration**: Multiple devs can deploy agents from same repo
4. **Production Deployment**: Git-based CI/CD for blockchain agents

## Contributing

This project is open source. Contributions welcome!

## License

MIT

---

**GitAgent: Making AI agent deployment as simple as `git push`** 🚀
