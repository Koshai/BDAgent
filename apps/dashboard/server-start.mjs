import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const child = spawn("pnpm", ["exec", "next", "start", "--hostname", "0.0.0.0", "--port", String(port)], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
