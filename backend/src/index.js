const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');

const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});