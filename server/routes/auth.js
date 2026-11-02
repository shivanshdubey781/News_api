'use strict';

const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = {
    id: 'user-1',
    email,
    name: email.split('@')[0],
  };

  const token = Buffer.from(JSON.stringify(user)).toString('base64');

  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json(user);
});

router.post('/logout', (_req, res) => {
  res.clearCookie('session', {
    httpOnly: true,
    sameSite: 'lax',
  });
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const session = req.cookies?.session;
  if (!session && !req.isMock) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (session) {
    try {
      const user = JSON.parse(Buffer.from(session, 'base64').toString('utf8'));
      return res.json(user);
    } catch (_e) {
      res.clearCookie('session');
    }
  }

  // Mock user fallback
  res.json({
    id: 'user-1',
    email: 'student@diploma.edu',
    name: 'Priya Sharma (Student)',
  });
});

module.exports = router;
