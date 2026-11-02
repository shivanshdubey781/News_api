'use strict';

function requireAuth(req, res, next) {
  const session = req.cookies?.session;

  if (req.isMock) {
    // In mock mode, if no session cookie, default to mock user
    req.user = {
      id: 'user-1',
      email: 'student@diploma.edu',
      name: 'Priya Sharma (Student)',
    };
    return next();
  }

  if (!session) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const user = JSON.parse(Buffer.from(session, 'base64').toString('utf8'));
    req.user = user;
    next();
  } catch (_e) {
    res.clearCookie('session');
    return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
  }
}

module.exports = { requireAuth };

