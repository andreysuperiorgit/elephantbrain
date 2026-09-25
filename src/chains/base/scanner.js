import { ethers } from "ethers";
import { createLogger } from "../../utils/logger.js";
import { ERC20_ABI, DANGEROUS_SELECTORS, detectEvmBundles } from "../evm/index.js";
import { BASE_CHAIN_ID } from "../../config/index.js";
import { enrichScan, recordToken, recordBundle } from "../../memory/index.js";

const log = createLogger("base-scanner");

/**
 * Scan a token on Base (Coinbase L2, OP Stack).
 */
export async function scanBaseToken(tokenAddress, rpcUrl) {
  const provider = new ethers.JsonRpcProvider(rpcUrl, {
    chainId: BASE_CHAIN_ID, name: "base",
  });

  log.info(`Scanning ${tokenAddress} on Base`);

  const results = {
    chain: "base", mint: tokenAddress, timestamp: Date.now(),
    mintAuthorityRevoked: false, freezeAuthorityRevoked: false,
    topHolderPercent: 1.0, bundleDetected: false,
    lpBurnPercent: 0, metadataWarnings: [], details: {},
    deployer: null, buyers: [],
    memory: { adjustment: 0, reasons: [] },
  };

  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [name, symbol, totalSupply, decimals] = await Promise.all([
      token.name().catch(() => "Unknown"),
      token.symbol().catch(() => "???"),
      token.totalSupply().catch(() => 0n),
      token.decimals().catch(() => 18),
    ]);

    results.details.name = name;
    results.details.symbol = symbol;
    results.details.supply = totalSupply.toString();
    // ethers v6 returns every integer as BigInt, uint8 included
    const dec = Number(decimals);
    results.details.decimals = dec;
    log.info(`  Token: ${name} (${symbol})`);

    let owner = null;
    try {
      owner = await token.owner();
      results.mintAuthorityRevoked = owner === ethers.ZeroAddress;
      results.deployer = owner !== ethers.ZeroAddress ? owner : null;
    } catch {
      results.mintAuthorityRevoked = true;
    }
    log.info(`  Owner: ${owner || "renounced"} → ${results.mintAuthorityRevoked ? "REVOKED ✓" : "ACTIVE ✗"}`);

    const bytecode = await provider.getCode(tokenAddress);
    const foundDangerous = [];
    for (const [sel, fname] of Object.entries(DANGEROUS_SELECTORS)) {
      if (bytecode.includes(sel.slice(2))) foundDangerous.push(fname);
    }

    results.freezeAuthorityRevoked = !foundDangerous.some(
      f => f.includes("pause") || f.includes("blacklist")
    );

    if (foundDangerous.includes("mint(address,uint256)") && !results.mintAuthorityRevoked) {
      results.mintAuthorityRevoked = false;
    }

    if (foundDangerous.length > 0) {
      log.info(`  Dangerous functions: ${foundDangerous.join(", ")}`);
      results.metadataWarnings.push(`Has: ${foundDangerous.join(", ")}`);
    }

    if (totalSupply > 0n) {
      const addressesToCheck = [owner].filter(Boolean);
      let knownHoldings = 0n;
      const holderDetails = [];

      for (const addr of addressesToCheck) {
        try {
          const bal = await token.balanceOf(addr);
          if (bal > 0n) {
            knownHoldings += bal;
            holderDetails.push({
              address: addr,
              amount: bal.toString(),
              percent: ((Number(bal) / Number(totalSupply)) * 100).toFixed(2) + "%",
            });
          }
        } catch {}
      }

      results.topHolderPercent = Number(knownHoldings) / Number(totalSupply);
      results.details.topHolders = holderDetails;
      log.info(`  Known holders: ${(results.topHolderPercent * 100).toFixed(1)}%`);
    }

    const bundleInfo = await detectEvmBundles(provider, tokenAddress);
    results.bundleDetected = bundleInfo.detected;
    results.buyers = bundleInfo.wallets;
    results.bundleBlock = bundleInfo.blockNumber;
    if (bundleInfo.detected && bundleInfo.wallets.length > 0) {
      try {
        recordBundle(tokenAddress, bundleInfo.wallets, bundleInfo.blockNumber, "base");
      } catch (e) { log.warn(`  Memory bundle write failed: ${e.message}`); }
    }
    log.info(`  Bundle: ${results.bundleDetected ? "YES ✗" : "NO ✓"}`);

    results.lpBurnPercent = 0.5;

    const realSupply = Number(totalSupply) / 10 ** dec;
    if (realSupply > 1e15) results.metadataWarnings.push("Extremely large supply");
    if (name.length > 50) results.metadataWarnings.push("Suspiciously long name");
    if (/test|scam|rug|fake/i.test(name + symbol)) {
      results.metadataWarnings.push("Suspicious keywords in name");
    }

    // [SECOND BRAIN] Enrich with historical context
    try {
      const memory = enrichScan({
        address: tokenAddress,
        chain: "base",
        deployer: results.deployer,
        buyers: results.buyers,
      });
      results.memory = memory;
      if (memory.adjustment !== 0) {
        log.info(`  Second Brain: ${memory.adjustment > 0 ? "+" : ""}${memory.adjustment} — ${memory.reasons.join("; ")}`);
      }
    } catch (e) {
      log.warn(`  Second Brain lookup failed: ${e.message}`);
    }

  } catch (err) {
    log.error(`Scan failed: ${err.message}`);
    results.metadataWarnings.push(`Scan error: ${err.message}`);
  }

  // [SECOND BRAIN] Record what we saw for future scans
  try {
    recordToken({
      address: tokenAddress,
      chain: "base",
      deployer: results.deployer,
      score: null,
      verdict: null,
    });
  } catch (e) { log.warn(`  Memory token write failed: ${e.message}`); }

  return results;
}
