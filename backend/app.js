const express = require('express');
const connectDB = require('./config/db');
const winston = require('winston');
const expressWinston = require('express-winston');
const promClient = require('prom-client');
const responseTime = require('response-time');

const app = express();

// Connect to MongoDB
connectDB();

// Create a Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

// Middleware for logging HTTP requests
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  colorize: true
}));

// Middleware for response time and Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
});

register.registerMetric(httpRequestDurationMicroseconds);

app.use(responseTime((req, res, time) => {
  if (req.route) {
    httpRequestDurationMicroseconds
      .labels(req.method, req.route.path, res.statusCode)
      .observe(time);
  }
}));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Middleware
app.use(express.json({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));