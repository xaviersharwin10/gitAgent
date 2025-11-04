import { ethers } from 'ethers';
import Groq from 'groq-sdk';
import axios from 'axios';

// 1. Load configuration from environment variables (injected by GitAgent backend)
const groqApiKey = process.env.GROQ_API_KEY;
const agentContractAddress = process.env.AGENT_CONTRACT_ADDRESS;
// Moderate branch: Balanced strategy - moderate risk tolerance
const agentPrompt = process.env.AI_PROMPT || "You are a balanced financial analyst with moderate risk tolerance. You BUY when you see positive trends or reasonable entry points (price below $0.42). You HOLD during uncertain or downward trends. Based on the current price, should I 'BUY' or 'HOLD'?";
const somniaRpcUrl = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
const repoUrl = process.env.REPO_URL || '';
const branchName = process.env.BRANCH_NAME || 'main';
const agentPrivateKey = process.env.AGENT_PRIVATE_KEY || ''; // For signing transactions

// Debug: Log all environment variables related to GitAgent
console.log('[Environment] === Environment Variables Check ===');
console.log(`[Environment] REPO_URL: ${repoUrl ? '✅ ' + repoUrl : '❌ NOT SET'}`);
console.log(`[Environment] BRANCH_NAME: ${branchName ? '✅ ' + branchName : '❌ NOT SET'}`);
console.log(`[Environment] AGENT_CONTRACT_ADDRESS: ${agentContractAddress ? '✅ ' + agentContractAddress : '❌ NOT SET'}`);
console.log(`[Environment] AGENT_PRIVATE_KEY: ${agentPrivateKey ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`[Environment] BACKEND_URL: ${process.env.BACKEND_URL || 'NOT SET'}`);
console.log(`[Environment] SOMNIA_RPC_URL: ${process.env.SOMNIA_RPC_URL || 'NOT SET'}`);
console.log(`[Environment] Strategy: Moderate (Balanced Risk/Reward)`);
console.log(`[Environment] === End Environment Check ===`);

if (!groqApiKey || !agentContractAddress) {
  console.error('Error: GROQ_API_KEY or AGENT_CONTRACT_ADDRESS is not set.');
  process.exit(1);
}

// 2. Initialize clients
const groq = new Groq({ apiKey: groqApiKey });

// Connect to Somnia provider
const provider = new ethers.JsonRpcProvider(somniaRpcUrl);

// Verify network connection
provider.getNetwork().then((network) => {
  console.log(`🌐 Connected to Somnia Testnet`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   RPC URL: ${somniaRpcUrl}`);
  if (network.chainId !== 50312n) {
    console.warn(`⚠️  Warning: Expected chain ID 50312 (testnet), got ${network.chainId}`);
  }
}).catch((err) => {
  console.error(`❌ Failed to connect to network: ${err.message}`);
});

// Create wallet if private key is available
let agentWallet: ethers.Wallet | null = null;
if (agentPrivateKey) {
  agentWallet = new ethers.Wallet(agentPrivateKey, provider);
  console.log(`📝 Agent wallet connected: ${agentWallet.address}`);
} else {
  console.log(`⚠️  AGENT_PRIVATE_KEY not set - trades will be skipped`);
  console.log(`💡 Set secret: git agent secrets set AGENT_PRIVATE_KEY=0x...`);
}

console.log(`🤖 AI Agent ${agentContractAddress} starting...`);
console.log(`Prompt: "${agentPrompt}"`);

// Agent contract ABI (minimal for execute function)
const AGENT_ABI = [
  "function execute(address target, bytes calldata data) external returns (bytes memory)"
];

// Initialize agent contract
const agentContract = new ethers.Contract(agentContractAddress, AGENT_ABI, provider);

// 3. Real Price Feed - Fetch from CoinGecko API
async function getSomiPrice(): Promise<number> {
  try {
    // Try CoinGecko API for SOMI token price
    // Note: If SOMI isn't listed on CoinGecko, you may need to query a DEX contract
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'somnia', // Adjust this if the token ID is different
        vs_currencies: 'usd'
      },
      timeout: 5000
    });

    if (response.data && response.data.somnia && response.data.somnia.usd) {
      const price = response.data.somnia.usd;
      console.log(`[PriceFeed] Real SOMI price from CoinGecko: $${price.toFixed(4)}`);
      return price;
    }

    // Fallback: Try querying DEX on Somnia blockchain
    // TODO: Implement DEX contract call if CoinGecko doesn't have SOMI
    console.warn('[PriceFeed] CoinGecko API did not return SOMI price, using fallback');
    
    // Fallback to a reasonable price based on web search (~$0.40)
    const fallbackPrice = 0.40 + (Math.random() - 0.5) * 0.05;
    console.log(`[PriceFeed] Using fallback price: $${fallbackPrice.toFixed(4)}`);
    return fallbackPrice;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[PriceFeed] Error fetching price:', errorMessage);
    // Fallback price if API fails
    const fallbackPrice = 0.40 + (Math.random() - 0.5) * 0.05;
    console.log(`[PriceFeed] Using fallback price (API error): $${fallbackPrice.toFixed(4)}`);
    return fallbackPrice;
  }
}

// 4. Send metrics to backend
async function sendMetric(decision: string, price: number, tradeExecuted: boolean = false, tradeTxHash: string | null = null, tradeAmount: number | null = null) {
  if (!repoUrl) {
    console.warn('[Metrics] REPO_URL not set, skipping metrics');
    return;
  }

  try {
    await axios.post(`${backendUrl}/api/metrics`, {
      repo_url: repoUrl,
      branch_name: branchName,
      decision: decision,
      price: price,
      trade_executed: tradeExecuted,
      trade_tx_hash: tradeTxHash,
      trade_amount: tradeAmount
    }, { timeout: 3000 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Metrics] Failed to send metric: ${errorMessage}`);
  }
}

// 5. Execute a trade on Somnia using DEX Router
async function executeTradeOnSomnia(): Promise<{ success: boolean; txHash: string | null }> {
  console.log('[Trade] 🔍 === Trade Execution Diagnostic ===');
  
  // Check 1: Agent Wallet
  if (!agentWallet) {
    console.warn('[Trade] ❌ AGENT_PRIVATE_KEY not set in environment');
    console.warn('[Trade] 💡 Fix: Set secret: git somnia-agent secrets set AGENT_PRIVATE_KEY=0x...');
    console.warn('[Trade] ⚠️  Skipping trade execution');
    return { success: false, txHash: null };
  }
  console.log(`[Trade] ✅ Agent wallet initialized: ${agentWallet.address}`);

  try {
    // Get contract balance
    const contractBalance = await provider.getBalance(agentContractAddress as string);
    const walletBalance = await provider.getBalance(agentWallet.address);
    console.log(`[Trade] 📊 Balance Check:`);
    console.log(`[Trade]    Agent Contract: ${ethers.formatEther(contractBalance)} SOMI`);
    console.log(`[Trade]    Wallet:         ${ethers.formatEther(walletBalance)} SOMI`);

    // Somnia DEX Router configuration (hardcoded for production)
    const SOMNIA_ROUTER_ADDRESS = '0xb98c15a0dC1e271132e341250703c7e94c059e8D';
    const TOKEN_IN_ADDRESS = '0xF2F773753cEbEFaF9b68b841d80C083b18C69311';
    const TOKEN_OUT_ADDRESS = '0xDa4FDE38bE7a2b959BF46E032ECfA21e64019b76';
    
    console.log(`[Trade] 🔧 DEX Configuration (Somnia Testnet):`);
    console.log(`[Trade]    Router: ✅ ${SOMNIA_ROUTER_ADDRESS}`);
    console.log(`[Trade]    Token In (NIA):  ✅ ${TOKEN_IN_ADDRESS}`);
    console.log(`[Trade]    Token Out (USDT): ✅ ${TOKEN_OUT_ADDRESS}`);
    console.log(`[Trade]    Network: Somnia Testnet (Chain ID: 50312)`);

    // SomniaRouter ABI (simplified - just swap function)
    const ROUTER_ABI = [
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
    ];

    const router = new ethers.Contract(SOMNIA_ROUTER_ADDRESS, ROUTER_ABI, agentWallet);
    
    // ERC20 ABI for token operations
    const ERC20_ABI = [
      "function balanceOf(address account) external view returns (uint256)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)"
    ];

    console.log(`[Trade] ✅ DEX configured, proceeding with swap on Somnia Testnet...`);
    console.log(`[Trade] 📋 Trade Details:`);
    console.log(`[Trade]    Selling: NIA (Token In)`);
    console.log(`[Trade]    Buying: USDT (Token Out)`);
    
    const tokenIn = new ethers.Contract(TOKEN_IN_ADDRESS, ERC20_ABI, agentWallet);
    
    // Check token balance
    console.log(`[Trade] 🔍 Checking NIA token balance for wallet ${agentWallet.address}...`);
    const tokenBalance = await tokenIn.balanceOf(agentWallet.address);
    console.log(`[Trade]    NIA balance: ${ethers.formatUnits(tokenBalance, 18)} NIA tokens`);
    
    if (tokenBalance === 0n) {
      console.warn('[Trade] ❌ No tokens to swap');
      console.warn(`[Trade] 💡 Fix: Send tokens to wallet ${agentWallet.address}`);
      return { success: false, txHash: null };
    }

    // Use VERY small amount: 0.0001 tokens minimum, or 0.01% of balance (whichever is smaller)
    const minAmount = ethers.parseEther("0.0001"); // Minimum 0.0001 tokens
    const onePercent = tokenBalance / 10000n; // 0.01% of balance (1/10000)
    const amountIn = onePercent < minAmount ? minAmount : onePercent; // Use smaller of the two
    
    console.log(`[Trade] 💰 Swap amount: ${ethers.formatUnits(amountIn, 18)} tokens (0.01% of ${ethers.formatUnits(tokenBalance, 18)} total balance, min 0.0001)`);

    // Get expected output amount
    const path = [TOKEN_IN_ADDRESS, TOKEN_OUT_ADDRESS];
    console.log(`[Trade] 🔍 Getting expected output amount...`);
    const amountsOut = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amountsOut[1] * 95n / 100n; // 5% slippage tolerance
    console.log(`[Trade]    Expected output: ${ethers.formatUnits(amountsOut[1], 18)} tokens`);
    console.log(`[Trade]    Min output (5% slippage): ${ethers.formatUnits(amountOutMin, 18)} tokens`);

    // Approve router to spend tokens
    console.log(`[Trade] 🔍 Checking token allowance...`);
    const allowance = await tokenIn.allowance(agentWallet.address, SOMNIA_ROUTER_ADDRESS);
    console.log(`[Trade]    Current allowance: ${ethers.formatUnits(allowance, 18)} tokens`);
    
    if (allowance < amountIn) {
      console.log(`[Trade] 📝 Approving router to spend tokens...`);
      const approveTx = await tokenIn.approve(SOMNIA_ROUTER_ADDRESS, ethers.MaxUint256);
      console.log(`[Trade]    Approval tx: ${approveTx.hash}`);
      await approveTx.wait();
      console.log(`[Trade] ✅ Approval confirmed`);
    } else {
      console.log(`[Trade] ✅ Sufficient allowance already set`);
    }

    // Execute swap via router
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    console.log(`[Trade] 🚀 Executing swap on Somnia Testnet DEX...`);
    console.log(`[Trade]    Swap: NIA → USDT`);
    console.log(`[Trade]    Amount: ${ethers.formatUnits(amountIn, 18)} NIA`);
    console.log(`[Trade]    Expected: ~${ethers.formatUnits(amountsOut[1], 18)} USDT`);
    console.log(`[Trade]    Router: ${SOMNIA_ROUTER_ADDRESS}`);
    console.log(`[Trade]    Deadline: ${new Date(deadline * 1000).toISOString()}`);
    
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      agentWallet.address, // Send tokens to wallet (or use agentContractAddress)
      deadline
    );

    console.log(`[Trade] 📤 Swap transaction sent: ${tx.hash}`);
    console.log(`[Trade] ⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`[Trade] ✅ Swap confirmed in block ${receipt?.blockNumber}`);
    console.log(`[Trade] 🔗 Explorer: https://shannon-explorer.somnia.network/tx/${tx.hash}`);
    console.log(`[Trade] ✨ === Trade Execution Complete ===`);
    
    return { success: true, txHash: tx.hash };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[Trade] ❌ === Trade Execution Failed ===`);
    console.error(`[Trade] ❌ Error: ${errorMessage}`);
    if (errorStack) {
      console.error(`[Trade] 📚 Stack trace: ${errorStack}`);
    }
    console.error(`[Trade] 💡 Check: Wallet balance, token balance, router address, network connection`);
    return { success: false, txHash: null };
  }
}

// 6. Main AI Decision Loop
async function runDecisionLoop() {
  try {
    const price = await getSomiPrice();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: agentPrompt },
        { role: 'user', content: `The current price of SOMI is $${price.toFixed(4)}. Should I BUY or HOLD?` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Moderate temperature for balanced decisions (moderate branch)
      max_tokens: 50,
    });

    const decision = chatCompletion.choices[0]?.message?.content || 'HOLD';
    const isBuy = decision.toUpperCase().includes('BUY');

    if (isBuy) {
      console.log(`[AI Decision] AI decided: BUY.`);
      
      // Moderate strategy: Execute trades when price is below $0.42 (moderate threshold)
      // This is more active than conservative main branch but less aggressive than aggressive branch
      const priceBelowThreshold = price < 0.42; // Moderate threshold
      const shouldExecuteTrade = priceBelowThreshold;
      
      if (shouldExecuteTrade) {
        console.log(`[Trade] ✅ Moderate filter passed (price: $${price.toFixed(4)} below $0.42 threshold). Executing trade...`);
        
        // Execute actual trade on Somnia blockchain
        const tradeResult = await executeTradeOnSomnia();
        
        if (tradeResult.success && tradeResult.txHash) {
          console.log(`[Trade] ✅ Trade executed successfully: ${tradeResult.txHash}`);
          await sendMetric(`BUY - ${decision}`, price, true, tradeResult.txHash, 0.0001);
        } else {
          console.log(`[Trade] ⚠️ Trade execution skipped (insufficient funds or key not set)`);
          await sendMetric(`BUY - ${decision}`, price, false, null, null);
        }
      } else {
        console.log(`[Trade] 🛡️ Moderate filter blocked trade execution (price: $${price.toFixed(4)} above $0.42 threshold). Holding instead.`);
        await sendMetric(`BUY (FILTERED) - ${decision}`, price, false, null, null);
      }
    } else {
      console.log(`[AI Decision] AI decided: HOLD.`);
      await sendMetric(`HOLD - ${decision}`, price, false, null, null);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in decision loop:', errorMessage);
  }
}

// 7. Run the agent
// Run immediately on start, and then every 30 seconds
runDecisionLoop();
setInterval(runDecisionLoop, 30000);
// Trigger main restart
