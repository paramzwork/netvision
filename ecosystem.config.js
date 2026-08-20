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
    },
  ],
};