#!/usr/bin/env node
/**
 * Production Start Script
 * Runs migrations then starts the server
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log("🔄 Running database migrations...");
    
    const proc = spawn("node", ["-r", "dotenv/config", "./run-migrations.mjs"], {
      cwd: __dirname,
      stdio: "inherit",
    });

    proc.on("exit", (code) => {
      if (code === 0) {
        console.log("✅ Migrations completed successfully!");
        resolve();
      } else {
        console.error(`❌ Migrations failed with code ${code}`);
        reject(new Error(`Migration exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      console.error("❌ Failed to run migrations:", err.message);
      reject(err);
    });
  });
}

async function startServer() {
  return new Promise(() => {
    console.log("\n🚀 Starting application server...");
    
    const proc = spawn("node", ["dist/index.js"], {
      cwd: __dirname,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });

    proc.on("error", (err) => {
      console.error("❌ Failed to start server:", err.message);
      process.exit(1);
    });
  });
}

async function main() {
  try {
    await runMigrations();
    await startServer();
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();
