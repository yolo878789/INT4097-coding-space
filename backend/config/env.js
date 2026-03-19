const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DB_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN'
];

// Check for missing required environment variables
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  dbUrl: process.env.DB_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  redisUrl: process.env.REDIS_URL,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
  }
};