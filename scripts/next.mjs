// Corre "next build" y/o "next start" siempre con NODE_ENV=production.
// La vista previa de GoDaddy ejecuta "npm run dev" con NODE_ENV=development, y compilar así
// rompe el prerender ("Cannot read properties of null (reading 'useContext')").
// Uso: node scripts/next.mjs build | start | build-start
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const env = { ...process.env, NODE_ENV: "production" };

const steps = {
  build: ["build", "--webpack"],
  start: ["start", "-H", "0.0.0.0"],
};
const mode = process.argv[2];
const plan = mode === "build-start" ? ["build", "start"] : [mode];
if (!plan.every((s) => s in steps)) {
  console.error("Uso: node scripts/next.mjs build | start | build-start");
  process.exit(1);
}

for (const step of plan) {
  const { status } = spawnSync(process.execPath, [nextBin, ...steps[step]], { stdio: "inherit", env });
  if (status !== 0) process.exit(status ?? 1);
}
