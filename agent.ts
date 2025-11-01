import { ethers } from 'ethers';
import Groq from 'groq-sdk';

// 1. Load configuration from environment variables (injected by GitAgent backend)
const groqApiKey = process.env.GROQ_API_KEY;
const agentContractAddress = process.env.AGENT_CONTRACT_ADDRESS;
const agentPrompt = process.env.AI_PROMPT || "You are a cautious financial analyst. Based on the price, should I 'BUY' or 'HOLD'?"; // Default prompt

if (!groqApiKey || !agentContractAddress) {
  console.error('Error: GROQ_API_KEY or AGENT_CONTRACT_ADDRESS is not set.');
  process.exit(1);
}

// 2. Initialize clients
const groq = new Groq({ apiKey: groqApiKey });
// TODO: Connect to Somnia provider
// const provider = new ethers.providers.JsonRpcProvider(process.env.SOMNIA_RPC_URL); 
// const agentContract = new ethers.Contract(agentContractAddress, AGENT_ABI, provider);

console.log(`🤖 AI Agent ${agentContractAddress} starting...`);
console.log(`Prompt: "${agentPrompt}"`);

// 3. Mock Price Feed
let currentMockPrice = 3000;
function getSomiPrice() {
  // Simulates price volatility
  currentMockPrice += (Math.random() - 0.5) * 50; 
  console.log(`[PriceFeed] New SOMI price: $${currentMockPrice.toFixed(2)}`);
  return currentMockPrice;
}

// 4. Main AI Decision Loop
async function runDecisionLoop() {
  try {
    const price = getSomiPrice();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: agentPrompt },
        { role: 'user', content: `The current price of SOMI is $${price.toFixed(2)}.` }
      ],
      model: 'llama-3.1-8b-instant', // Updated to current Groq model
      temperature: 0.5,
      max_tokens: 50,
    });

    const decision = chatCompletion.choices[0]?.message?.content || 'HOLD';

    if (decision.includes('BUY')) {
      console.log(`[AI Decision] AI decided: BUY. Executing trade...`);
      // TODO: Implement actual trade logic
      // const tx = await agentContract.execute(DEX_ADDRESS, ...);
      // console.log(`Trade executed: ${tx.hash}`);

    } else {
      console.log(`[AI Decision] AI decided: HOLD.`);
    }

  } catch (error) {
    console.error('Error in decision loop:', error);
  }
}

// 5. Run the agent
// Run immediately on start, and then every 30 seconds
runDecisionLoop();
setInterval(runDecisionLoop, 30000);
