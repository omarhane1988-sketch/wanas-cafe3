services:
  - type: web
    name: cafe-pos-pro
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: npm run init-db && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SESSION_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: cafe-pos-pro-db
          property: connectionString

databases:
  - name: cafe-pos-pro-db
    plan: free
