import { createServer } from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './middleware/logger';
import { setupWebSocket } from './websocket';

if (!process.env.JWT_SECRET) {
  if (config.env === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  logger.warn('JWT_SECRET not set — using insecure default. Set it before deploying.');
}

const app = createApp();
const server = createServer(app);
setupWebSocket(server);

server.listen(config.port, () => {
  logger.info(`AgentHQ server running on port ${config.port} [${config.env}]`);
});
