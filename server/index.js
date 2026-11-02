'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const casesRoutes = require('./routes/cases');
const authRoutes = require('./routes/auth');
const { rateLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_MOCK = process.env.NODE_ENV !== 'production' && process.env.USE_MOCKS !== 'false';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(rateLimiter);

// Attach mock flag to every request
app.use((req, _res, next) => {
  req.isMock = IS_MOCK;
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/articles', newsRoutes);   // /api/articles/:id uses same router
app.use('/api/ai', aiRoutes);
app.use('/api/cases', casesRoutes);

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mock: IS_MOCK, ts: new Date().toISOString() });
});

// ── Error handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  // Never leak stack traces or secrets in responses
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT} | mock=${IS_MOCK}`);
});

module.exports = app;

