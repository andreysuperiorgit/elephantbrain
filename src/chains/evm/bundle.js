/**
 * Coordinated first buys on an EVM token.
 *
 * Reads the last 1,000 blocks of Transfer logs. Five or more transfers in
 * one block is a bundle. Returns the block the buys actually landed in —
 * not the chain head — and the recipients, bundle block first.
 */

import { ethers } from "ethers";

export async function detectEvmBundles(provider, tokenAddress) {
  try {
    const currentBlock = await provider.getBlockNumber();
    const filter = {
      address: tokenAddress,
      topics: [ethers.id("Transfer(address,address,uint256)")],
      fromBlock: currentBlock - 1000,
      toBlock: currentBlock,
    };
    const logs = await provider.getLogs(filter);
    if (logs.length < 3) return { detected: false, wallets: [], blockNumber: currentBlock };

    const blockCounts = {};
    for (const l of logs) blockCounts[l.blockNumber] = (blockCounts[l.blockNumber] || 0) + 1;
    const detected = Object.values(blockCounts).some((count) => count >= 5);

    // The block that matters is the one the buys landed in. Recording the
    // chain head instead made every token look like it launched "now", and
    // same-block matching across tokens (Herd Map) meaningless.
    let bundleBlock = logs[0].blockNumber;
    for (const [b, c] of Object.entries(blockCounts)) {
      if (c > (blockCounts[bundleBlock] || 0)) bundleBlock = Number(b);
    }

    // Recipients in the bundle block first, then the earliest others
    const wallets = [];
    const ordered = [
      ...logs.filter((l) => l.blockNumber === bundleBlock),
      ...logs.filter((l) => l.blockNumber !== bundleBlock),
    ];
    for (const l of ordered) {
      if (wallets.length >= 15) break;
      try {
        const to = ("0x" + l.topics[2].slice(-40)).toLowerCase();
        if (!wallets.includes(to) && to !== ethers.ZeroAddress) wallets.push(to);
      } catch {}
    }

    return { detected, wallets, blockNumber: bundleBlock };
  } catch { return { detected: false, wallets: [], blockNumber: null }; }
}
