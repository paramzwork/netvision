module.exports = {
  apps: [
    {
      name: "netvision",
      cwd: "/var/www/netvision",
      script: "npm",
      args: "start",

      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      autorestart: true,
      restart_delay: 5000,
      watch: false,
    },

    {
      name: "traffic-poller",
      cwd: "/var/www/netvision",
      script: "dist/scripts/pollWorker.js",

      env: {
        NODE_ENV: "production",
      },

      autorestart: true,
      restart_delay: 5000,
      watch: false,
    },
  ],
};