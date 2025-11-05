# 🤖 SomniaPush Agent Template

> **Quick Start Template** — Clone this repository to deploy your own AI trading agent on Somnia blockchain in 5 minutes.

This is a ready-to-use template for creating autonomous AI agents that trade on Somnia blockchain. Just clone, configure, and push to deploy!

---

## 🚀 What is This?

This template provides a complete, production-ready AI agent that:
- ✅ Makes trading decisions using AI (Groq LLM)
- ✅ Executes trades on Somnia DEX automatically
- ✅ Sends metrics to SomniaPush dashboard
- ✅ Works out of the box with minimal configuration

**Perfect for:** DeFi trading bots, automated strategies, A/B testing different approaches

---

## ⚡ Quick Start (5 Minutes)

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

# Required: Your agent's private key (for signing transactions)
git somnia-agent secrets set AGENT_PRIVATE_KEY=0x-your-private-key-here

# Optional: Custom AI prompt for your strategy
git somnia-agent secrets set AI_PROMPT="Your custom trading strategy prompt"
```

### Step 6: Configure Webhook

Visit **[https://somnia-git-agent.onrender.com](https://somnia-git-agent.onrender.com)** and:
1. Enter your repository URL
2. Click "Authorize GitHub"
3. Webhook is automatically configured!

### Step 7: Deploy Your Agent

```bash
git push origin main
```

**That's it!** Your agent is now:
- ✅ Deployed as a smart contract on Somnia testnet
- ✅ Running and making trading decisions
- ✅ Visible in the [SomniaPush Dashboard](https://somnia-git-agent.onrender.com/dashboard)

---

## 📊 Monitor Your Agent

### Using CLI

```bash
# Check real-time stats
git somnia-agent stats

# View live logs
git somnia-agent logs

# Verify secrets are set
git somnia-agent secrets check
```

### Using Dashboard

Visit **[https://somnia-git-agent.onrender.com/dashboard](https://somnia-git-agent.onrender.com/dashboard)** to see:
- Live metrics (decisions, trades, success rate)
- Recent trades with transaction hashes
- Agent performance comparison
- Real-time logs

---

## 🔄 Create Multiple Strategies (A/B Testing)

Each Git branch becomes a separate agent contract! Test different strategies in parallel:

```bash
# Create a new strategy branch
git checkout -b aggressive-strategy

# Modify agent.ts with your strategy
# ... edit the code ...

# Deploy as separate agent
git push origin aggressive-strategy

# Compare performance
git somnia-agent compare main aggressive-strategy
```

Now you have **2 agents running in parallel** on Somnia, each with its own smart contract!

---

## ⚙️ Configuration

### Environment Variables

The agent uses these environment variables (set via `git somnia-agent secrets set`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key for AI decisions |
| `AGENT_PRIVATE_KEY` | ✅ Yes | Private key for signing transactions |
| `AI_PROMPT` | ❌ No | Custom prompt for your trading strategy |
| `AGENT_CONTRACT_ADDRESS` | 🔄 Auto | Set automatically by SomniaPush |
| `BACKEND_URL` | 🔄 Auto | Set automatically by SomniaPush |
| `SOMNIA_RPC_URL` | 🔄 Auto | Set automatically by SomniaPush |

### Customizing Your Agent

Edit `agent.ts` to customize:

1. **Trading Strategy** — Modify the `agentPrompt` variable
2. **Decision Logic** — Change how BUY/HOLD decisions are made
3. **Trade Execution** — Adjust trade amounts, slippage, etc.
4. **Price Thresholds** — Set your entry/exit points

**Example:** Change the conservative filter in `agent.ts`:
```typescript
// Only execute BUY if price < $0.38 or 30% random chance
if (price < 0.38 || Math.random() < 0.3) {
  // Execute trade
}
```

---

## 📁 Project Structure

```
gitAgent/
├── agent.ts              # Main agent logic (edit this!)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── .gitagent.json        # SomniaPush config (auto-generated)
├── env.example           # Example environment variables
└── README.md             # This file
```

---

## 🎯 How It Works

1. **Agent fetches price** from CoinGecko API
2. **AI makes decision** using Groq LLM (BUY or HOLD)
3. **If BUY:** Agent executes trade on Somnia DEX (NIA → USDT)
4. **Metrics sent** to SomniaPush backend
5. **Dashboard updates** in real-time

**Decision Loop:** Runs every 30 seconds automatically

---

## 🔗 Key Features

### 🤖 AI-Powered Decisions
- Uses Groq LLM for intelligent trading decisions
- Customizable prompts for different strategies
- Context-aware analysis of market conditions

### 💰 Real DEX Integration
- Executes actual swaps on Somnia DEX
- Supports NIA → USDT trades
- Automatic slippage protection
- Transaction tracking with on-chain proof

### 📊 Built-in Monitoring
- Automatic metrics collection
- Real-time dashboard updates
- Transaction history with explorer links
- Performance analytics

### 🔄 Branch-Based A/B Testing
- Each branch = separate agent contract
- Parallel strategy testing
- Easy performance comparison
- Git-native workflow

---

## 🛠️ Development

### Local Testing

```bash
# Install dependencies
npm install

# Run agent locally (requires all env vars)
npx ts-node agent.ts
```

### Making Changes

1. Edit `agent.ts` with your strategy
2. Test locally (optional)
3. Commit and push:
   ```bash
   git add agent.ts
   git commit -m "Update trading strategy"
   git push origin main
   ```
4. Agent automatically redeploys with new code!

---

## 📚 Resources

- **SomniaPush Dashboard**: [https://somnia-git-agent.onrender.com/dashboard](https://somnia-git-agent.onrender.com/dashboard)
- **SomniaPush Platform**: [https://github.com/xaviersharwin10/somnia-git-agent](https://github.com/xaviersharwin10/somnia-git-agent)
- **CLI Documentation**: [npmjs.com/package/git-somnia-agent](https://www.npmjs.com/package/git-somnia-agent)
- **Somnia Docs**: [docs.somnia.network](https://docs.somnia.network)
- **Get Test Tokens**: [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0)

---

## ❓ Troubleshooting

### Agent not making decisions?
- Check if `GROQ_API_KEY` is set: `git somnia-agent secrets check`
- Verify agent is running: Check dashboard or `git somnia-agent stats`

### Agent not executing trades?
- Ensure `AGENT_PRIVATE_KEY` is set correctly
- Check if agent wallet has NIA tokens for swaps
- Verify DEX addresses are correct in `agent.ts`

### Webhook not working?
- Visit [https://somnia-git-agent.onrender.com](https://somnia-git-agent.onrender.com) to reconfigure
- Check GitHub repository settings → Webhooks

### Need help?
- Check [SomniaPush Platform README](https://github.com/xaviersharwin10/somnia-git-agent)
- Join [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0) for support

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details.

---

## 🚀 Next Steps

1. ✅ Clone this template
2. ✅ Set your secrets
3. ✅ Configure webhook
4. ✅ Push to deploy
5. 🎉 Watch your agent trade on Somnia!

**Ready to deploy?** Just `git push` and you're live! 🚀

---

<div align="center">

**Built with ❤️ for the [Somnia AI Hackathon](https://x.com/SomniaEco)**

[Get Started](#-quick-start-5-minutes) • [View Dashboard](https://somnia-git-agent.onrender.com/dashboard) • [Platform Docs](https://github.com/xaviersharwin10/somnia-git-agent)

</div>
