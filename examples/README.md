# Examples

| file | what it is |
|:--|:--|
| `seed-demo.js` | `npm run demo` — fills `data/demo.db` with a small scenario and prints the report |
| `feed-activity.sh` | curl calls for feeding movements and funding links into a running server |
| `inspect-report.json` | the full report for the demo token, as `GET /api/elephant/base/:address` returns it |
| `deployer-memory.json` | `traceDeployer()` for the demo deployer |
| `herd-map.json` | `buildHerd()` around the demo token, with 3D positions |
| `matriarch-score.json` | `matriarchScore()` for one of the crew wallets |
| `alerts.json` | the alert raised when liquidity left the demo pool |
| `laptop-scan-result.json` | a scan response for the $LAPTOP case in the README |

The JSON files are real output. Regenerate them with:

```sh
node examples/seed-demo.js --write-examples
```

The demo writes to its own database and never touches `data/memory.db`.
