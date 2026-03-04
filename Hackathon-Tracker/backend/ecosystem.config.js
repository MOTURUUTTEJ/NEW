/**
 * PM2 Ecosystem Configuration
 * Usage:
 *   pm2 start ecosystem.config.js          → start
 *   pm2 reload ecosystem.config.js         → zero-downtime reload
 *   pm2 stop hackathon-backend             → stop
 *   pm2 save && pm2 startup                → auto-start on EC2 reboot
 */
module.exports = {
    apps: [
        {
            name: 'hackathon-backend',
            script: 'server.js',
            instances: 1,               // increase to 'max' for cluster mode
            exec_mode: 'fork',          // use 'cluster' if scaling
            watch: false,               // disable file-watching in production
            max_memory_restart: '300M', // auto-restart if memory exceeds 300MB

            // Environment for production
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000,
            },

            // Logging
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Restart policy
            autorestart: true,
            restart_delay: 3000,        // wait 3s before restarting on crash
            max_restarts: 10,
        },
    ],
};
