# 🚀 GitAgent CLI Installation Guide

## Quick Install (For Demo/Hackathon)

### Option 1: Install from GitHub (Recommended)

```bash
# Install directly from GitHub
npm install -g https://github.com/xaviersharwin10/gitAgent.git#main --prefix=./git-agent-cli

# Or clone and install locally
git clone https://github.com/xaviersharwin10/gitAgent.git
cd gitAgent/git-agent-cli
npm install -g .
```

### Option 2: Use npx (No Installation)

```bash
# Use npx to run directly without installing
npx -p https://github.com/xaviersharwin10/gitAgent.git#main git-somnia-agent --help
```

### Step 2: Set Up Git Alias

After installation, set up the Git alias so you can use `git somnia-agent`:

```bash
git config --global alias.somnia-agent '!git-somnia-agent'
```

### Step 3: Verify Installation

```bash
git somnia-agent --help
```

You should see the command help menu!

## Full Setup Instructions

### 1. Fork/Clone Agent Template

```bash
# Fork the agent template repository
# Or clone it:
git clone https://github.com/xaviersharwin10/gitAgent.git my-ai-agent
cd my-ai-agent
```

### 2. Initialize GitAgent

```bash
git somnia-agent init
```

This will:
- Ask for your GitHub repository URL
- Create `.gitagent.json` file

### 3. Set Secrets

```bash
# Set your Groq API key
git somnia-agent secrets set GROQ_API_KEY=sk-your-key-here

# Optional: Set custom AI prompt
git somnia-agent secrets set AI_PROMPT="You are an aggressive trader"
```

### 4. Configure GitHub Webhook

1. Go to your GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. **Payload URL**: `https://somnia-git-agent.onrender.com/webhook/github`
   > **Note**: This is the production GitAgent backend URL.
4. **Content type**: `application/json`
5. **Events**: Select "Just the push event"
6. Click "Add webhook"

### 5. Deploy Your Agent

```bash
git push origin main
```

This will:
- Trigger the webhook
- Deploy `Agent.sol` contract on Somnia
- Clone your code
- Run your agent with PM2

### 6. Monitor Your Agent

```bash
# Get real-time stats
git somnia-agent stats

# View live logs
git somnia-agent logs

# Compare branches
git somnia-agent compare main aggressive
```

## Troubleshooting

### "git somnia-agent: command not found"

Make sure you:
1. Installed the CLI: `npm install -g git-somnia-agent`
2. Set up the alias: `git config --global alias.somnia-agent '!git-somnia-agent'`

### "Not a GitAgent repository"

Run `git somnia-agent init` in your repository root.

### Backend Connection Errors

Check that the backend URL in `git-agent-cli/index.js` matches your deployed backend URL.

## For Hackathon Judges

**Quick Demo Setup (2 minutes):**

```bash
# 1. Install CLI
npm install -g https://github.com/xaviersharwin10/gitAgent.git#main --prefix=./git-agent-cli
git config --global alias.somnia-agent '!git-somnia-agent'

# 2. Clone a test repo (if you have one)
git clone <your-agent-repo>
cd <your-agent-repo>

# 3. Initialize
git somnia-agent init

# 4. Try the commands
git somnia-agent stats
git somnia-agent logs
```

## Demo Video Link

[Add your 5-minute demo video link here]

## Live Dashboard

Access the live dashboard at:
`https://somnia-git-agent.onrender.com/dashboard`

> **Note**: This is the production dashboard URL.

