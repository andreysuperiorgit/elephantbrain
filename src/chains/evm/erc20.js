/**
 * What every EVM scanner reads from a token contract, and which function
 * selectors in its bytecode mean the owner keeps a hand on the wheel.
 */

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
];

/** Selectors that let an owner pause, blacklist or mint at will. */
export const DANGEROUS_SELECTORS = {
  "0x8456cb59": "pause()",
  "0x3f4ba83a": "unpause()",
  "0x44337ea1": "blacklist(address)",
  "0x40c10f19": "mint(address,uint256)",
};
