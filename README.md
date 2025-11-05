# 🤖 SomniaPush Agent Template

> **Production-Ready Template** — Clone this repository to deploy your own AI trading agent on Somnia blockchain. Includes DEX integration, multiple strategy branches, and full monitoring.

This is a **ready-to-use agent template** powered by SomniaPush. It provides a complete, production-ready AI agent that makes trading decisions and executes trades on Somnia DEX automatically.

---

## 📋 What This Template Includes

### 🎯 Current Features

This agent template comes with:

- ✅ **AI-Powered Trading Decisions** — Uses Groq LLM to analyze market conditions and make BUY/HOLD decisions
- ✅ **Real DEX Integration** — Executes actual token swaps on Somnia DEX (NIA → USDT)
- ✅ **Automated Execution** — Runs continuously, making decisions every 30 seconds
- ✅ **Metrics & Monitoring** — Sends metrics to SomniaPush dashboard automatically
- ✅ **Multiple Strategy Branches** — Pre-configured branches with different trading strategies

### 📊 Pre-Configured Strategy Branches

This template includes **4 branches** with different trading strategies:

| Branch | Strategy | Risk Level | Description |
|--------|----------|------------|-------------|
| **main** | Conservative | Low | Filters BUY signals, only trades when price < $0.38 or 30% chance |
| **aggressive** | High Risk | High | Executes all BUY signals, higher temperature (0.7), no filters |
| **moderate** | Balanced | Medium | Moderate risk tolerance, trades when price < $0.42 |
| **test-branch** | Testing | Variable | Used for testing webhook and deployment flow |

**Each branch deploys as a separate agent contract**, allowing you to test different strategies in parallel on Somnia blockchain!

### 💰 DEX Trading Features

The agent executes real trades on **Somnia DEX**:
- **Token Pair**: NIA → USDT swaps
- **Trade Amount**: Very small amounts (0.01% of balance or 0.0001 tokens minimum)
- **Slippage Protection**: Built-in tolerance for price changes
- **Transaction Tracking**: Every trade has on-chain proof with transaction hash

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone This Template

```bash
git clone https://github.com/xaviersharwin10/gitAgent.git
cd gitAgent
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Install SomniaPush CLI

```bash
npm install -g git-somnia-agent
git config --global alias.somnia-agent '!git-somnia-agent'
```

### Step 4: Initialize SomniaPush

```bash
git somnia-agent init
```

This creates a `.gitagent.json` file that connects your repository to SomniaPush.

### Step 5: Set Your Secrets

```bash
# Required: Your Groq API key (get one at https://console.groq.com)
git somnia-agent secrets set GROQ_API_KEY=your-groq-key-here

# Required: Your agent's private key (for signing transactions on Somnia)
git somnia-agent secrets set AGENT_PRIVATE_KEY=0x-your-private-key-here

# Optional: Custom AI prompt for your strategy
git somnia-agent secrets set AI_PROMPT="Your custom trading strategy prompt"
```

**💡 Get Test Tokens:** Join [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0) and request test tokens for your agent wallet.

### Step 6: Configure Webhook

Visit **[https://somnia-git-agent.onrender.com](https://somnia-git-agent.onrender.com)** and:
1. Enter your repository URL
2. Click "Authorize GitHub"
3. Webhook is automatically configured!

### Step 7: Deploy Your Agent

```bash
# Deploy main branch (conservative strategy)
git push origin main
```

**That's it!** Your agent is now:
- ✅ Deployed as a smart contract on Somnia testnet
- ✅ Running and making trading decisions
- ✅ Visible in the [SomniaPush Dashboard](https://somnia-git-agent.onrender.com/dashboard)
- ✅ Ready to execute trades on Somnia DEX

---

## 📊 Monitor Your Agent

### Using CLI

```bash
# Check real-time stats
git somnia-agent stats

# View live logs (decisions, trades, errors)
git somnia-agent logs

# Verify secrets are set correctly
git somnia-agent secrets check
```

### Using Dashboard

Visit **[https://somnia-git-agent.onrender.com/dashboard](https://somnia-git-agent.onrender.com/dashboard)** to see:
- 📈 Live metrics (decisions, trades, success rate)
- 💸 Recent trades with transaction hashes and explorer links
- ⚔️ Agent performance comparison (if you have multiple branches)
- 📝 Real-time logs and decision history

---

## 🔄 Deploy Multiple Strategy Branches

Each Git branch becomes a **separate agent contract** on Somnia! Test different strategies in parallel:

### Deploy All Pre-Configured Branches

```bash
# Deploy conservative strategy (main branch)
git checkout main
git push origin main

# Deploy aggressive strategy
git checkout aggressive
git push origin aggressive

# Deploy moderate strategy
git checkout moderate
git push origin moderate
```

Now you have **3 agents running in parallel**, each with its own smart contract and strategy!

### Compare Strategies

```bash
# Compare main vs aggressive
git somnia-agent compare main aggressive

# Compare all strategies
git somnia-agent compare main moderate aggressive
```

### Create Your Own Strategy Branch

```bash
# Create a new strategy branch
git checkout -b my-custom-strategy

# Modify agent.ts with your strategy
# ... edit the code ...

# Deploy as separate agent
git push origin my-custom-strategy
```

---

## ⚙️ Configuration & Customization

### Environment Variables

The agent uses these environment variables (set via `git somnia-agent secrets set`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key for AI decisions ([get one here](https://console.groq.com)) |
| `AGENT_PRIVATE_KEY` | ✅ Yes | Private key for signing transactions on Somnia |
| `AI_PROMPT` | ❌ No | Custom prompt for your trading strategy |
| `AGENT_CONTRACT_ADDRESS` | 🔄 Auto | Set automatically by SomniaPush when agent deploys |
| `BACKEND_URL` | 🔄 Auto | Set automatically by SomniaPush |
| `SOMNIA_RPC_URL` | 🔄 Auto | Set automatically by SomniaPush |

### Customizing Your Agent Strategy

Edit `agent.ts` to customize your trading strategy:

#### 1. Change AI Prompt

```typescript
const agentPrompt = "You are an aggressive degen trader. Should I 'BUY' or 'HOLD'?";
```

#### 2. Modify Decision Logic

```typescript
// Conservative filter example (main branch)
if (price < 0.38 || Math.random() < 0.3) {
  // Execute trade
}
```

#### 3. Adjust Trade Amounts

```typescript
// In executeTradeOnSomnia function
const amountIn = balance * 0.0001; // 0.01% of balance
const minAmount = ethers.parseUnits('0.0001', 18); // 0.0001 tokens minimum
```

#### 4. Change Price Thresholds

```typescript
// Moderate branch example
if (price < 0.42) {
  // Consider BUY
}
```

### DEX Configuration

The DEX addresses are hardcoded in `agent.ts` for production:

```typescript
const SOMNIA_ROUTER_ADDRESS = '0xb98c15a0dC1e271132e341250703c7e94c059e8D';
const TOKEN_IN_ADDRESS = '0xF2F773753cEbEFaF9b68b841d80C083b18C69311'; // NIA
const TOKEN_OUT_ADDRESS = '0xDa4FDE38bE7a2b959BF46E032ECfA21e64019b76'; // USDT
```

These are configured for **Somnia Testnet** and work out of the box.

---

## 📁 Project Structure

```
gitAgent/
├── agent.ts              # Main agent logic (edit this for your strategy!)
├── package.json          # Dependencies (ethers.js, groq-sdk, etc.)
├── tsconfig.json         # TypeScript configuration
├── .gitagent.json        # SomniaPush config (auto-generated by `git somnia-agent init`)
├── env.example           # Example environment variables (for local testing)
└── README.md             # This file
```

---

## 🎯 How It Works

The agent runs in a continuous loop:

1. **Fetch Price** — Gets current SOMI price from CoinGecko API
2. **AI Decision** — Uses Groq LLM to analyze market conditions
3. **Decision Made** — Returns BUY or HOLD
4. **Execute Trade** (if BUY) — Swaps NIA → USDT on Somnia DEX
5. **Send Metrics** — Reports decision and trade to SomniaPush backend
6. **Wait 30 seconds** — Then repeats

**The agent runs automatically** once deployed via `git push`. No manual intervention needed!

---

## 🔗 Key Features

### 🤖 AI-Powered Decisions
- Uses **Groq LLM** for intelligent trading decisions
- Customizable prompts for different strategies
- Context-aware analysis of market conditions
- Temperature control for risk level (0.3 conservative, 0.7 aggressive)

### 💰 Real DEX Integration
- Executes actual swaps on **Somnia DEX** (SomniaRouter)
- Supports **NIA → USDT** trades
- Automatic slippage protection
- Transaction tracking with on-chain proof
- Small trade amounts (0.01% or 0.0001 tokens minimum)

### 📊 Built-in Monitoring
- Automatic metrics collection
- Real-time dashboard updates
- Transaction history with explorer links
- Performance analytics
- Success rate tracking

### 🔄 Branch-Based A/B Testing
- Each branch = separate agent contract on Somnia
- Parallel strategy testing
- Easy performance comparison via CLI
- Git-native workflow (no new tools needed)

---

## 🛠️ Development & Testing

### Local Testing

```bash
# Install dependencies
npm install

# Copy env.example to .env
cp env.example .env

# Edit .env with your actual values
# Then run agent locally:
npx ts-node agent.ts
```

**Note:** Local testing requires all environment variables. For production, SomniaPush injects these automatically.

### Making Changes to Your Strategy

1. **Edit `agent.ts`** with your strategy changes
2. **Test locally** (optional):
   ```bash
   npx ts-node agent.ts
   ```
3. **Commit and push**:
   ```bash
   git add agent.ts
   git commit -m "Update trading strategy"
   git push origin main
   ```
4. **Agent automatically redeploys** with new code!

### Switching Between Branches

```bash
# View all branches
git branch -a

# Switch to aggressive strategy
git checkout aggressive

# Make changes and deploy
git push origin aggressive
```

---

## ❓ Troubleshooting

### Agent not making decisions?
- ✅ Check if `GROQ_API_KEY` is set: `git somnia-agent secrets check`
- ✅ Verify agent is running: Check dashboard or `git somnia-agent stats`
- ✅ Check logs: `git somnia-agent logs`

### Agent not executing trades?
- ✅ Ensure `AGENT_PRIVATE_KEY` is set correctly
- ✅ Check if agent wallet has NIA tokens for swaps (get from [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0))
- ✅ Verify DEX addresses are correct in `agent.ts` (should be hardcoded)
- ✅ Check agent logs for transaction errors

### Webhook not working?
- ✅ Visit [https://somnia-git-agent.onrender.com](https://somnia-git-agent.onrender.com) to reconfigure
- ✅ Check GitHub repository settings → Webhooks
- ✅ Verify webhook URL: `https://somnia-git-agent.onrender.com/webhook/github/push`

### Need help?
- 📚 Check [SomniaPush Platform README](https://github.com/xaviersharwin10/somnia-git-agent)
- 💬 Join [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0) for support
- 🌐 Visit [Somnia Docs](https://docs.somnia.network)

---

## 📚 Resources

### SomniaPush Platform
- **Live Dashboard**: [https://somnia-git-agent.onrender.com/dashboard](https://somnia-git-agent.onrender.com/dashboard)
- **Platform Repository**: [https://github.com/xaviersharwin10/somnia-git-agent](https://github.com/xaviersharwin10/somnia-git-agent)
- **CLI Package**: [npmjs.com/package/git-somnia-agent](https://www.npmjs.com/package/git-somnia-agent)

### Somnia Blockchain
- **Somnia Docs**: [docs.somnia.network](https://docs.somnia.network)
- **Somnia Testnet**: [testnet.somnia.network](https://testnet.somnia.network)
- **Get Test Tokens**: [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0)
- **Somnia Explorer**: [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network)

### External Services
- **Groq API**: [console.groq.com](https://console.groq.com) (for AI decisions)
- **CoinGecko**: Used for price data (built-in, no setup needed)

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details.

---

## 🚀 Next Steps

1. ✅ Clone this template
2. ✅ Set your secrets (`GROQ_API_KEY`, `AGENT_PRIVATE_KEY`)
3. ✅ Configure webhook (automatic via SomniaPush)
4. ✅ Push to deploy (`git push origin main`)
5. 🎉 Watch your agent trade on Somnia!

**Ready to deploy?** Just `git push` and you're live! 🚀

**Want to test multiple strategies?** Deploy different branches (main, aggressive, moderate) and compare their performance!

---

<div align="center">

**Built with ❤️ for the [Somnia AI Hackathon](https://x.com/SomniaEco)**

[Get Started](#-quick-start-5-minutes) • [View Dashboard](https://somnia-git-agent.onrender.com/dashboard) • [Platform Docs](https://github.com/xaviersharwin10/somnia-git-agent)

</div>
