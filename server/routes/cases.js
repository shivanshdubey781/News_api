'use strict';

const express = require('express');
const router = express.Router();
const fixtures = require('../mock/fixtures');

// In-memory case store initialized with fixtures
const casesStore = [...fixtures.cases];

// GET /api/cases
router.get('/', (_req, res) => {
  res.json(casesStore);
});

// GET /api/cases/:id
router.get('/:id', (req, res) => {
  const c = casesStore.find((item) => item.id === req.params.id);
  if (!c) {
    return res.status(404).json({ error: 'Case not found' });
  }
  res.json(c);
});

// POST /api/cases
router.post('/', (req, res) => {
  const { title, topic } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newCase = {
    id: `case-${Date.now()}`,
    title: title.trim(),
    topic: (topic || 'General Investigation').trim(),
    createdAt: new Date().toISOString(),
    ownerId: req.user?.id || 'user-1',
    pinnedArticles: [],
    claims: [],
    sourceLog: [],
  };

  casesStore.unshift(newCase);
  res.status(201).json(newCase);
});

// POST /api/cases/:id/sources
router.post('/:id/sources', (req, res) => {
  const c = casesStore.find((item) => item.id === req.params.id);
  if (!c) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const { url, outlet, accessDate, whatItSupports } = req.body || {};
  if (!url || !outlet) {
    return res.status(400).json({ error: 'url and outlet are required' });
  }

  const entry = {
    url,
    outlet,
    accessDate: accessDate || new Date().toISOString(),
    whatItSupports: whatItSupports || 'General supporting reference',
    investigationId: req.params.id,
  };

  c.sourceLog.push(entry);
  res.status(201).json({ ok: true, entry });
});

// GET /api/cases/:id/sources.csv
router.get('/:id/sources.csv', (req, res) => {
  const c = casesStore.find((item) => item.id === req.params.id);
  if (!c) {
    return res.status(404).send('Case not found');
  }

  const headers = ['URL', 'Outlet', 'Access Date', 'What It Supports'];
  const rows = c.sourceLog.map((entry) => [
    `"${(entry.url || '').replace(/"/g, '""')}"`,
    `"${(entry.outlet || '').replace(/"/g, '""')}"`,
    `"${(entry.accessDate || '').replace(/"/g, '""')}"`,
    `"${(entry.whatItSupports || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="source-log-${req.params.id}.csv"`
  );
  res.send(csv);
});

module.exports = router;
