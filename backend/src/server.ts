import { app } from "./app";
import { env } from "./config/env";
import { API_PREFIX, ExitCode } from "./constants/domain";
import { pool } from "./db/pool";

// `app.listen` starts accepting HTTP requests and returns a server handle.
const server = app.listen(env.PORT, () => {
  console.log(`API ready on http://localhost:${env.PORT}${API_PREFIX}`);
});

// "Graceful shutdown": stop taking new connections, then close the database connection pool so Postgres does not keep dead connections open.
function shutdown(): void {
  server.close(() => {
    void pool.end().then(() => process.exit(ExitCode.Success));
  });
}

// SIGINT = Ctrl+C in a terminal. SIGTERM = a request from the OS/Docker to stop.
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
