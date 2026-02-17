import { createApp } from './app';
import { config } from './config';
import { logger } from './middleware/logger';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`AgentHQ server running on port ${config.port} [${config.env}]`);
});
