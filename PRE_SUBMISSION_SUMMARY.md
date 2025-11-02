# 🎯 Pre-Submission Quick Summary

## 🔴 CRITICAL: 4 Things You MUST Do

### 1. Deploy Backend to Production (Render.com)
**Why:** Currently on ngrok (temporary). Judges need a permanent URL.

**Steps:**
1. Go to https://render.com
2. Create account → New Web Service
3. Connect GitHub repo → Select `backend` folder
4. Set env vars:
   - `BACKEND_PRIVATE_KEY`
   - `SOMNIA_RPC_URL=https://dream-rpc.somnia.network`
   - `AGENT_FACTORY_ADDRESS=<your-address>`
   - `MASTER_SECRET_KEY`
   - `BACKEND_URL=https://your-service.onrender.com`
5. Deploy → Get URL (e.g., `https://gitagent.onrender.com`)

**Time:** 30 minutes

---

### 2. Update CLI with Production URL
**File:** `git-agent-cli/index.js` line 19

**Change:**
```javascript
// FROM:
const API_BASE_URL = 'https://unabortive-davion-refractorily.ngrok-free.dev';

// TO:
const API_BASE_URL = 'https://your-backend.onrender.com';
```

**Then:** Commit and push

**Time:** 2 minutes

---

### 3. Add Contract Address to README
**File:** `HACKATHON_README.md` line 62

**Change:**
```markdown
- **Deployed Contract**: [Add your AgentFactory address after deployment]
```

**To:**
```markdown
- **Deployed Contract**: `0xYourActualAddress` (verify on [Shannon Explorer](https://shannon-explorer.somnia.network/address/0xYourActualAddress))
```

**How to Find:**
- Check your Hardhat deployment logs
- Or check the transaction that deployed AgentFactory.sol

**Time:** 5 minutes

---

### 4. Update Demo Repository Webhook
**Where:** GitHub → Your demo repo → Settings → Webhooks

**Change:**
- FROM: `https://unabortive-davion-refractorily.ngrok-free.dev/webhook/github`
- TO: `https://your-backend.onrender.com/webhook/github`

**Test:** Make a test push to verify webhook triggers

**Time:** 2 minutes

---

## 📊 Current State vs Required State

| Component | Current | Required | Status |
|-----------|---------|----------|--------|
| Backend | ngrok (temporary) | Production hosting | ⚠️ Need to deploy |
| CLI URL | Hardcoded ngrok | Production URL | ⚠️ Need to update |
| Dashboard | ngrok URL | Production URL | ⚠️ Need to update docs |
| Contract Address | Missing | In README | ⚠️ Need to add |
| Demo Repo Webhook | Points to ngrok | Points to production | ⚠️ Need to update |
| Demo Video | Not recorded | 5-min video | ⚠️ Need to record |

---

## ✅ What's Already Working

- ✅ Smart contracts deployed to Somnia
- ✅ Backend functional (locally)
- ✅ CLI functional (locally)
- ✅ Dashboard functional
- ✅ Agent deployment flow works
- ✅ Metrics tracking works
- ✅ A/B testing works

---

## 🎬 Demo Video Checklist

**Must Show (5 minutes max):**
1. [ ] CLI installation (`npm install -g git-somnia-agent`)
2. [ ] `git somnia-agent init`
3. [ ] `git somnia-agent secrets set GROQ_API_KEY=...`
4. [ ] `git push origin main` → Show contract deploying
5. [ ] Dashboard showing agent running
6. [ ] `git somnia-agent stats`
7. [ ] Create `aggressive` branch → Push → Compare
8. [ ] Show contract on explorer
9. [ ] Show agent transaction

---

## 📦 Submission Package

**You Need:**
- [ ] Demo video (YouTube/Vimeo link)
- [ ] Pitch deck (5-10 slides, PDF)
- [ ] GitHub repository (public)
- [ ] Live demo links:
  - Dashboard: `https://your-backend.onrender.com/dashboard`
  - API: `https://your-backend.onrender.com/api/agents`
- [ ] Contract addresses:
  - AgentFactory: `0x...`
  - Example Agent: `0x...`

---

## ⚡ Quick Action Plan

**Right Now (Priority 1):**
1. Deploy backend to Render.com → Get production URL
2. Update CLI `index.js` with production URL
3. Update demo repo webhook to production URL
4. Add contract address to README

**Before Submission (Priority 2):**
5. Update all documentation with production URLs
6. Record demo video
7. Create pitch deck
8. Test everything end-to-end

**Total Time:** ~2-3 hours

---

## 🎯 Success Criteria

**Judges should be able to:**
- ✅ Install CLI: `npm install -g git-somnia-agent`
- ✅ Access dashboard: `https://your-backend.onrender.com/dashboard`
- ✅ See agents running and making decisions
- ✅ Verify contracts on explorer
- ✅ Use CLI commands successfully

**If all above work → You're ready to submit! 🚀**

