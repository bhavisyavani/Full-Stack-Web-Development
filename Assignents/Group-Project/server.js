
import { startServer } from './server/server.js';

startServer().catch((err) => {
  console.error('Backend startup failed:', err);
  process.exitCode = 1;
});
