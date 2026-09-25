/**
 * One scan, start to finish: read the chain, score it, write the verdict
 * back to memory, and let the memory modules learn the early buyers.
 *
 * The HTTP routes and the live monitors both come through here, so the
 * sequence exists once instead of once per caller.
 */

import { scanSolanaToken } from "../chains/solana/scanner.js";
import { scanRobinhoodToken } from "../chains/robinhood/scanner.js";
import { scanBaseToken } from "../chains/base/scanner.js";
import { getRugCheckReport } from "../chains/solana/rugcheck.js";
import { calculateScore } from "../scoring/index.js";
import { analyzeWithGrok, isGrokEnabled } from "../ai/grok.js";
import { recordVerdict } from "../memory/index.js";
import { ingestScan } from "../terminal/index.js";

export const SCANNERS = {
  solana: { scan: scanSolanaToken, rpc: () => process.env.SOLANA_RPC_URL },
  robinhood: { scan: scanRobinhoodToken, rpc: () => process.env.ROBINHOOD_RPC_URL },
  base: { scan: scanBaseToken, rpc: () => process.env.BASE_RPC_URL },
};

/**
 * @param {string} chain    solana | robinhood | base
 * @param {string} address  the token
 * @param {object} [o]
 * @param {boolean} [o.extras=false]  add RugCheck (Solana) and Grok, as the API does
 */
export async function runScan(chain, address, { extras = false } = {}) {
  const s = SCANNERS[chain];
  if (!s) throw new Error(`unknown chain "${chain}"`);

  const checks = await s.scan(address, s.rpc());
  const result = calculateScore(checks);

  // the verdict the engine just produced, so deployer history is not blank
  try { recordVerdict(address, result.score, result.verdict); } catch {}
  // the early buyers, so Herd Map and Deployer Memory learn from ordinary use
  try { ingestScan(address, chain, checks); } catch {}

  const data = { ...checks, ...result };
  if (extras) {
    if (chain === "solana") {
      data.rugcheck = process.env.RUGCHECK_API_KEY ? await getRugCheckReport(address) : null;
    }
    if (isGrokEnabled()) data.grok = await analyzeWithGrok(data);
  }
  return data;
}
