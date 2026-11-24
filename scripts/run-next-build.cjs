const { spawnSync } = require("node:child_process");
const path = require("node:path");

const preload = "--require=./scripts/next-build-mkdir-race-fix.cjs";
const existingNodeOptions = process.env.NODE_OPTIONS?.trim();

process.env.NODE_OPTIONS = existingNodeOptions
  ? `${existingNodeOptions} ${preload}`
  : preload;

const nextCli = path.resolve("node_modules/next/dist/bin/next");
const result = spawnSync(
  process.execPath,
  [nextCli, "build", "--webpack"],
  { stdio: "inherit", env: process.env }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
