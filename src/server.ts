import { app } from "./app";
import { env } from "./config/env";
import { API_PREFIX, ExitCode } from "./constants/domain";
import { pool } from "./db/pool";

const server = app.listen(env.PORT, () => {
  console.log(`API ready on http://localhost:${env.PORT}${API_PREFIX}`);
});

function shutdown(): void {
  server.close(() => {
    void pool.end().then(() => process.exit(ExitCode.Success));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);