import fs from "node:fs";

if (fs.existsSync(".next")) {
  fs.rmSync(".next", { recursive: true, force: true });
  console.log("Cleared stale .next development cache.");
}
