'use strict';

const express = require('express');
const router = express.Router();
const fixtures = require('../mock/fixtures');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-secret-token-change-in-production';

// Helper to stream mock response via SSE
function sendMockSse(res, body) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const action = body.action || 'chat';
  const tokens = fixtures.streamedAnswer.split(' ');
  let idx = 0;

  const interval = setInterval(() => {
    if (idx < tokens.length) {
      const data = JSON.stringify({ token: tokens[idx] + ' ' });
      res.write(`data: ${data}\n\n`);
      idx++;
    } else {
      clearInterval(interval);
      const doneData = JSON.stringify({
        done: true,
        id: `ai-${Date.now()}`,
        citations: fixtures.citations,
        comparison: action === 'compare' ? fixtures.comparison : undefined,
        timeline: action === 'timeline' ? fixtures.timeline : undefined,
        verifyResult: action === 'verify' ? fixtures.verifyResult : undefined,
      });
      res.write(`data: ${doneData}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }, 20);

  reqCloseHandler(res, interval);
}

function reqCloseHandler(res, interval) {
  res.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}

// POST /api/ai/ask
router.post('/ask', async (req, res) => {
  const body = req.body || {};

  if (req.isMock) {
    return sendMockSse(res, body);
  }

  // Forward to FastAPI SSE stream
  try {
    const investigationId = body.caseId || 'global';
    const question = body.prompt || 'Summarize this news story.';

    const upstream = await fetch(`${AI_SERVICE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        investigation_id: investigationId,
        question: question,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      console.warn(`[ai proxy] /ask upstream returned ${upstream.status}, falling back to mock SSE`);
      return sendMockSse(res, body);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    req.on('close', () => reader.cancel().catch(() => {}));

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.warn('[ai proxy] Upstream failed, using mock stream:', err.message);
    return sendMockSse(res, body);
  }
});

// POST /api/ai/compare
router.post('/compare', async (req, res) => {
  const { investigation_id, event_query } = req.body || {};

  if (req.isMock) {
    return res.json(fixtures.comparison);
  }

  try {
    const resp = await fetch(`${AI_SERVICE_URL}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        investigation_id: investigation_id || 'global',
        event_query: event_query || 'Compare outlets on this event',
      }),
    });

    if (!resp.ok) {
      return res.json(fixtures.comparison);
    }
    const data = await resp.json();
    res.json(data);
  } catch (_e) {
    res.json(fixtures.comparison);
  }
});

// POST /api/ai/timeline
router.post('/timeline', async (req, res) => {
  const { investigation_id, story_query } = req.body || {};

  if (req.isMock) {
    return res.json(fixtures.timeline);
  }

  try {
    const resp = await fetch(`${AI_SERVICE_URL}/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        investigation_id: investigation_id || 'global',
        story_query: story_query || 'Build timeline for this story',
      }),
    });

    if (!resp.ok) {
      return res.json(fixtures.timeline);
    }
    const data = await resp.json();
    res.json(data);
  } catch (_e) {
    res.json(fixtures.timeline);
  }
});

// POST /api/ai/verify
router.post('/verify', async (req, res) => {
  const { claim, investigation_id } = req.body || {};

  if (req.isMock) {
    return res.json(fixtures.verifyResult);
  }

  try {
    const resp = await fetch(`${AI_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        claim: claim || 'Verify this claim',
        investigation_id: investigation_id || undefined,
      }),
    });

    if (!resp.ok) {
      return res.json(fixtures.verifyResult);
    }
    const data = await resp.json();
    res.json(data);
  } catch (_e) {
    res.json(fixtures.verifyResult);
  }
});

module.exports = router;

