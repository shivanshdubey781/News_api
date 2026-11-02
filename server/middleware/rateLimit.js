'use strict';

const rateLimit = require('express-rate-limit');

exports.rateLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

