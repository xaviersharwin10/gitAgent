import { ethers } from 'ethers';
import Groq from 'groq-sdk';
import axios from 'axios';

// 1. Load configuration from environment variables (injected by GitAgent backend)
const groqApiKey = process.env.GROQ_API_KEY;
const agentContractAddress = process.env.AGENT_CONTRACT_ADDRESS;
const agentPrompt = process.env.AI_PROMPT || "You are a cautious financial analyst. Based on the price, should I 'BUY' or 'HOLD'?"; // Default prompt
const somniaRpcUrl = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
const repoUrl = process.env.REPO_URL || '';
const branchName = process.env.BRANCH_NAME || 'main';
const agentPrivateKey = process.env.AGENT_PRIVATE_KEY || ''; // For signing transactions

if (!groqApiKey || !agentContractAddress) {
  console.error('Error: GROQ_API_KEY or AGENT_CONTRACT_ADDRESS is not set.');
  process.exit(1);
}

// 2. Initialize clients
const groq = new Groq({ apiKey: groqApiKey });

// Connect to Somnia provider
const provider = new ethers.JsonRpcProvider(somniaRpcUrl);

// Agent contract ABI (minimal for execute function)
const AGENT_ABI = [
  "function execute(address target, bytes calldata data) external returns (bytes memory)"
];

// Initialize agent contract
const agentContract = new ethers.Contract(agentContractAddress, AGENT_ABI, provider);

// Create wallet if private key is available
let agentWallet: ethers.Wallet | null = null;
if (agentPrivateKey) {
  agentWallet = new ethers.Wallet(agentPrivateKey, provider);
  console.log(`📝 Agent wallet connected: ${agentWallet.address}`);
}

console.log(`🤖 AI Agent ${agentContractAddress} starting...`);
console.log(`Prompt: "${agentPrompt}"`);

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
  if (!agentWallet) {
    console.warn('[Trade] Agent private key not set, skipping trade execution');
    console.warn('[Trade] Set AGENT_PRIVATE_KEY secret to enable trade execution');
    return { success: false, txHash: null };
  }

  try {
    // Get contract balance
    const contractBalance = await provider.getBalance(agentContractAddress as string);
    const walletBalance = await provider.getBalance(agentWallet.address);
    console.log(`[Trade] Agent contract balance: ${ethers.formatEther(contractBalance)} SOMI`);
    console.log(`[Trade] Wallet balance: ${ethers.formatEther(walletBalance)} SOMI`);

    // Somnia DEX Router configuration
    // TODO: Replace with actual deployed SomniaRouter address
    const SOMNIA_ROUTER_ADDRESS = process.env.SOMNIA_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000';
    const TOKEN_IN_ADDRESS = process.env.TOKEN_IN_ADDRESS || ethers.ZeroAddress; // e.g., wSTT
    const TOKEN_OUT_ADDRESS = process.env.TOKEN_OUT_ADDRESS || ethers.ZeroAddress; // e.g., USDC
    
    if (SOMNIA_ROUTER_ADDRESS === '0x0000000000000000000000000000000000000000' || 
        TOKEN_IN_ADDRESS === ethers.ZeroAddress || 
        TOKEN_OUT_ADDRESS === ethers.ZeroAddress) {
      console.warn('[Trade] DEX configuration not set. Using fallback: sending SOMI to contract.');
      // Fallback: Simple token transfer if DEX not configured
      const amount = ethers.parseEther("0.001");
      if (walletBalance < amount + ethers.parseEther("0.0001")) {
        console.warn('[Trade] Insufficient wallet balance for trade');
        return { success: false, txHash: null };
      }
      const tx = await agentWallet.sendTransaction({
        to: agentContractAddress as string,
        value: amount,
      });
      const receipt = await tx.wait();
      console.log(`[Trade] ✅ Transaction confirmed in block ${receipt?.blockNumber}`);
      return { success: true, txHash: tx.hash };
    }

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

    const tokenIn = new ethers.Contract(TOKEN_IN_ADDRESS, ERC20_ABI, agentWallet);
    
    // Check token balance
    const tokenBalance = await tokenIn.balanceOf(agentWallet.address);
    if (tokenBalance === 0n) {
      console.warn('[Trade] No tokens to swap');
      return { success: false, txHash: null };
    }

    // Use a small amount for the swap (e.g., 1% of balance or minimum)
    const amountIn = tokenBalance > ethers.parseUnits("100", 18) 
      ? tokenBalance / 100n  // 1% of balance
      : tokenBalance;

    // Get expected output amount
    const path = [TOKEN_IN_ADDRESS, TOKEN_OUT_ADDRESS];
    const amountsOut = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amountsOut[1] * 95n / 100n; // 5% slippage tolerance

    // Approve router to spend tokens
    const allowance = await tokenIn.allowance(agentWallet.address, SOMNIA_ROUTER_ADDRESS);
    if (allowance < amountIn) {
      console.log('[Trade] Approving router to spend tokens...');
      const approveTx = await tokenIn.approve(SOMNIA_ROUTER_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Execute swap via router
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    console.log(`[Trade] Executing swap: ${ethers.formatUnits(amountIn, 18)} tokens via SomniaRouter...`);
    
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      agentWallet.address, // Send tokens to wallet (or use agentContractAddress)
      deadline
    );

    console.log(`[Trade] 📤 Swap transaction sent: ${tx.hash}`);
    console.log(`[Trade] Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`[Trade] ✅ Swap confirmed in block ${receipt?.blockNumber}`);
    console.log(`[Trade] 🔗 View on explorer: https://explorer.somnia.network/tx/${tx.hash}`);
    
    return { success: true, txHash: tx.hash };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Trade] ❌ Error executing trade: ${errorMessage}`);
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
      temperature: 0.5,
      max_tokens: 50,
    });

    const decision = chatCompletion.choices[0]?.message?.content || 'HOLD';
    const isBuy = decision.toUpperCase().includes('BUY');

    if (isBuy) {
      console.log(`[AI Decision] AI decided: BUY. Executing trade on Somnia...`);
      
      // Execute actual trade on Somnia blockchain
      const tradeResult = await executeTradeOnSomnia();
      
      if (tradeResult.success && tradeResult.txHash) {
        console.log(`[Trade] ✅ Trade executed successfully: ${tradeResult.txHash}`);
        await sendMetric(`BUY - ${decision}`, price, true, tradeResult.txHash, 0.001);
      } else {
        console.log(`[Trade] ⚠️ Trade execution skipped (insufficient funds or key not set)`);
        await sendMetric(`BUY - ${decision}`, price, false, null, null);
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
