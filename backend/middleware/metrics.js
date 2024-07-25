const client = require('prom-client');
const express = require('express');
const router = express.Router();

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'devops-blog-api'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Define a custom metric
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code']
});

// Register the custom metric
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to measure request duration
router.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.originalUrl, code: res.statusCode });
  });
  next();
});

// Expose metrics endpoint
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;