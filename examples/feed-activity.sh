#!/usr/bin/env sh
# Feeding ELEPHANTBRAIN from your own sources. The server must be running
# against the demo memory:  EB_MEMORY_PATH=data/demo.db npm run server
# (run `npm run demo` first). The addresses below are from the demo.

API=${API:-http://localhost:3001}
TOKEN=0x6eabb67a16ae99e08512d22c9244777f186520cb
WALLET=0xaa96e99ed41b3350ae1616bb7a3b1017e1c7dee9

# a large sell — raises `large_move` if it clears the threshold
curl -s -X POST "$API/api/elephant/activity" -H "content-type: application/json" \
  -d "{\"wallet\":\"$WALLET\",\"token\":\"$TOKEN\",\"chain\":\"base\",\"side\":\"sell\",\"amountUsd\":40000,\"block\":21020100}"
echo

# liquidity leaving, with the pool size so the share can be judged
curl -s -X POST "$API/api/elephant/activity" -H "content-type: application/json" \
  -d "{\"wallet\":\"$WALLET\",\"token\":\"$TOKEN\",\"chain\":\"base\",\"side\":\"remove_lp\",\"amountUsd\":12000,\"liquidityUsd\":60000,\"block\":21020140}"
echo

# who funded whom — recorded with its source, so it is never mistaken for chain data
curl -s -X POST "$API/api/elephant/funding" -H "content-type: application/json" \
  -d "{\"wallet\":\"$WALLET\",\"funder\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"base\",\"source\":\"my-notes\"}"
echo

# read it all back
curl -s "$API/api/elephant/base/$TOKEN" | head -c 600; echo
curl -s "$API/api/elephant/alerts?token=$TOKEN"; echo
