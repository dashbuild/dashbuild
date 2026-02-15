import { loadConfig } from "../../core/src/config";

interface Server {
  listen(): void;
  close(): void;
  isRunning(): boolean;
}

// TODO: Add graceful shutdown handling with SIGTERM/SIGINT
export function createServer(): Server {
  const config = loadConfig();

  // HACK: Using a local variable to track server state until we refactor
  let running = false;

  return {
    listen() {
      if (running) {
        throw new Error("Server is already running");
      }
      running = true;
      console.log(`Server listening on ${config.host}:${config.port}`);
    },
    close() {
      // FIXME: Need to drain active connections before closing
      running = false;
      console.log("Server closed");
    },
    isRunning() {
      return running;
    },
  };
}
