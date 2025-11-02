# GitAgent CLI for Somnia

This is the command-line tool for interacting with the GitAgent platform on Somnia.

## Installation

```bash
npm install -g .
git config --global alias.somnia-agent '!git-somnia-agent'
```
(For development, use `npm link` in this directory, then set up the alias)

## Commands

* `git somnia-agent init` - Initialize GitAgent in a repo.
* `git somnia-agent secrets set <KEY=VALUE>` - Set a secret for the current branch.
* `git somnia-agent stats` - Get real-time stats for the current branch's agent.
* `git somnia-agent logs` - Get the last 50 lines of agent logs.
* `git somnia-agent compare <branch1> <branch2>` - Compare performance between two branches.

## Features

- 🚀 **Easy Initialization**: Interactive setup with sensible defaults
- 🔐 **Secure Secrets**: Encrypted secret storage per branch
- 📊 **Real-time Monitoring**: Live stats and logs from running agents
- 🔄 **Branch Comparison**: Side-by-side performance comparison
- 🎨 **Beautiful Output**: Color-coded messages and clear feedback
- ⚡ **Fast**: Lightweight and responsive CLI experience

## Usage

### Initialize a Repository

```bash
git somnia-agent init
```

This will:
- Create a `.gitagent.json` file in your repository
- Prompt for your GitHub repository URL
- Provide next steps for deployment

### Set Secrets

```bash
git somnia-agent secrets set GROQ_API_KEY=sk-your-key-here
git somnia-agent secrets set AI_PROMPT="You are an aggressive trader"
```

Secrets are encrypted and stored securely for the current branch.

### Get Agent Information

```bash
git somnia-agent stats    # Get performance stats
git somnia-agent logs     # Get agent logs
```

### Compare Branches

```bash
git somnia-agent compare main feature-branch
```

## Configuration

The CLI creates a `.gitagent.json` file in your repository root:

```json
{
  "repo_url": "https://github.com/username/repo.git"
}
```

## Development

To test the CLI locally:

```bash
npm link
git config --global alias.somnia-agent '!git-somnia-agent'
git somnia-agent --help
```

> **Note:** The alias is required to use `git somnia-agent` commands. Alternatively, you can use `git-somnia-agent` directly without the alias.

## Features

- 🚀 **Easy Initialization**: Interactive setup with sensible defaults
- 🔐 **Secure Secrets**: Encrypted secret storage per branch
- 📊 **Agent Monitoring**: Stats and logs for deployed agents
- 🔄 **Branch Comparison**: Compare performance across branches
- 🎨 **Beautiful Output**: Color-coded messages and clear feedback
- ⚡ **Fast**: Lightweight and responsive CLI experience

## Requirements

- Node.js 16+
- Git repository
- GitAgent backend running (for full functionality)






