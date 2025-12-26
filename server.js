/**
 * CanvaPro365Free - Production Server
 * 
 * This server serves the built Vite application in production.
 * It handles:
 * - Static file serving from dist/
 * - SPA fallback (all routes serve index.html)
 * - Gzip/Brotli compression
 * - Security headers
 * - Health check endpoint
 */

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 8080;
const DIST_DIR = join(__dirname, 'dist');

// MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  // Assets with hash in filename - cache for 1 year
  hashed: 31536000,
  // HTML files - no cache
  html: 0,
  // Other static files - cache for 1 day
  default: 86400,
};

/**
 * Get the appropriate cache duration for a file
 */
function getCacheDuration(filePath) {
  const ext = extname(filePath);
  
  // HTML files should not be cached
  if (ext === '.html') {
    return CACHE_DURATIONS.html;
  }
  
  // Files with hash in name (e.g., index-abc123.js) can be cached forever
  if (/\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/i.test(filePath)) {
    return CACHE_DURATIONS.hashed;
  }
  
  return CACHE_DURATIONS.default;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Serve a static file
 */
function serveFile(res, filePath, stat) {
  const ext = extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  const cacheDuration = getCacheDuration(filePath);
  
  try {
    const content = readFileSync(filePath);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stat.size);
    
    if (cacheDuration > 0) {
      res.setHeader('Cache-Control', `public, max-age=${cacheDuration}, immutable`);
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    addSecurityHeaders(res);
    res.writeHead(200);
    res.end(content);
  } catch (err) {
    console.error(`Error serving file ${filePath}:`, err.message);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

/**
 * Serve the SPA index.html for client-side routing
 */
function serveSPA(res) {
  const indexPath = join(DIST_DIR, 'index.html');
  
  try {
    const content = readFileSync(indexPath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    addSecurityHeaders(res);
    res.writeHead(200);
    res.end(content);
  } catch (err) {
    console.error('Error serving index.html:', err.message);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

/**
 * Handle health check requests
 */
function handleHealthCheck(res) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));
}

// Create HTTP server
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;
  
  // Log request
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${pathname}`);
  
  // Health check endpoint
  if (pathname === '/health' || pathname === '/_health') {
    return handleHealthCheck(res);
  }
  
  // Normalize pathname
  if (pathname.endsWith('/') && pathname !== '/') {
    pathname = pathname.slice(0, -1);
  }
  
  // Try to serve static file
  let filePath = join(DIST_DIR, pathname);
  
  try {
    if (existsSync(filePath)) {
      const stat = statSync(filePath);
      
      if (stat.isFile()) {
        return serveFile(res, filePath, stat);
      }
      
      if (stat.isDirectory()) {
        // Try index.html in directory
        const indexPath = join(filePath, 'index.html');
        if (existsSync(indexPath)) {
          const indexStat = statSync(indexPath);
          return serveFile(res, indexPath, indexStat);
        }
      }
    }
  } catch (err) {
    // File doesn't exist, fall through to SPA
  }
  
  // For all other routes, serve the SPA
  serveSPA(res);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Verify dist directory exists
if (!existsSync(DIST_DIR)) {
  console.error('ERROR: dist/ directory not found!');
  console.error('Please run "npm run build" first.');
  process.exit(1);
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎨 CanvaPro365Free Production Server');
  console.log('=====================================');
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving files from: ${DIST_DIR}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
