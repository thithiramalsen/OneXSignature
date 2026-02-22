import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * NOTE: This is a basic implementation for demonstration.
 * In production, use a library like express-rate-limit with Redis backend
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in non-production to avoid blocking local debugging
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Do not rate-limit CORS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Get client identifier (IP address + user agent)
    const identifier = `${req.ip}-${req.get('user-agent')}`;
    const now = Date.now();

    if (!store[identifier]) {
      store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (store[identifier].resetTime < now) {
      store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (store[identifier].count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((store[identifier].resetTime - now) / 1000),
      });
    }

    store[identifier].count++;
    next();
  };
};

// Pre-configured rate limiters
export const authLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
export const apiLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes
export const uploadLimiter = createRateLimiter(50, 15 * 60 * 1000); // 10 uploads per 15 minutes
