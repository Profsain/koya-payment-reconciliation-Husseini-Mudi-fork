// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

// my solution to handle the case where there are multiple events with the same txn_id, 
// and we want to take the latest one based on the timestamp.
const fs = require("fs");

// Map to store the latest event for each txn_id
const latestByTxnId = new Map();
// Read the payments.jsonl file and process each line
const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");

// Iterate through each line in the file and parse the JSON event
for (const line of lines) {
  if (line.length === 0) continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch (e) {
    console.error(`Failed to parse line: ${line}`);
    continue;
  }

  if (!event || typeof event !== "object" || !event.txn_id) continue;

  const previous = latestByTxnId.get(event.txn_id);
  if (!previous || Date.parse(event.ts) >= Date.parse(previous.ts)) {
    latestByTxnId.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;

for (const event of latestByTxnId.values()) {
  if (event.status === "success") {
    total += Number(String(event.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}