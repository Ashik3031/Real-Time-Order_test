// Lightweight in-memory rate limiter middleware
// Tracks requests per IP address over a sliding/resetting time window

const createRateLimiter = ({ windowMs = 60 * 1000, max = 20, message = 'Too many requests, please try again later.' }) => {
  const clients = new Map();

  // Periodic cleanup of stale entries to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of clients.entries()) {
      if (now > data.resetTime) {
        clients.delete(ip);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = clients.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 1,
        resetTime: now + windowMs,
      };
      clients.set(clientIp, clientData);
    } else {
      clientData.count += 1;
    }

    // Set standard rate limit headers
    const remaining = Math.max(0, max - clientData.count);
    const resetSeconds = Math.ceil((clientData.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (clientData.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: `${resetSeconds}s`,
      });
    }

    next();
  };
};

module.exports = createRateLimiter;
