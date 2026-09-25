/**
 * Every schema change, in order. Adding one means adding a file and a line
 * here. Never edit a migration that has shipped — someone's database has
 * already applied it, and changing it will not run it again.
 */

import m001 from "./001-baseline.js";
import m002 from "./002-followup-scheduling.js";
import m003 from "./003-outcome-history.js";
import m004 from "./004-wallet-linkage.js";
import m005 from "./005-elephantbrain.js";

export const MIGRATIONS = [m001, m002, m003, m004, m005];
