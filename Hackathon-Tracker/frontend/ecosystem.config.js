/**
 * PM2 Ecosystem Configuration for Frontend
 * Usage:
 *   pm2 start ecosystem.config.js          → start static server
 *   pm2 reload frontend-app                → zero-downtime reload
 *   pm2 stop frontend-app                  → stop
 */
module.exports = {
    apps: [
        {
            name: 'frontend-app',
            script: 'serve',
            env: {
                PM2_SERVE_PATH: './dist',
                PM2_SERVE_PORT: 5173,      // Port to serve the app on
                PM2_SERVE_SPA: 'true',     // Single Page Application mode (fallback to index.html)
                PM2_SERVE_HOMEPAGE: '/index.html'
            }
        }
    ]
};
