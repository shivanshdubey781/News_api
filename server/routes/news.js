'use strict';

const express = require('express');
const router = express.Router();
const fixtures = require('../mock/fixtures');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-secret-token-change-in-production';

// GET /api/news
router.get('/', async (req, res) => {
  const { q, topic, country, outlet, sourceType } = req.query;

  if (req.isMock) {
    let result = [...fixtures.articles];
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(lower) || a.snippet.toLowerCase().includes(lower)
      );
    }
    if (outlet) {
      result = result.filter((a) => a.outlet.toLowerCase() === outlet.toLowerCase());
    }
    if (sourceType) {
      result = result.filter((a) => a.sourceType === sourceType);
    }
    return res.json(result);
  }

  // Forward to AI service scout endpoint
  try {
    const scoutRes = await fetch(`${AI_SERVICE_URL}/scout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        query: q || topic || 'top news',
        country: country || undefined,
        limit: 20,
      }),
    });

    if (!scoutRes.ok) {
      // Degrade gracefully to fixtures if scout fails
      console.warn(`[news proxy] AI service /scout returned ${scoutRes.status}; falling back to fixtures`);
      return res.json(fixtures.articles);
    }

    const data = await scoutRes.json();
    return res.json(data);
  } catch (err) {
    console.warn('[news proxy] Failed to reach AI service, serving fixtures:', err.message);
    return res.json(fixtures.articles);
  }
});

// GET /api/articles/:id (or /api/news/:id)
router.get('/:id', (req, res) => {
  const article = fixtures.articles.find((a) => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

module.exports = router;

