# 🗄️ Database Migration Guide: SQLite → PostgreSQL

## 📊 **Current vs Production Database Setup**

### **Development (Current)**
```bash
Database: SQLite
File: backend/prisma/dev.db
Provider: "sqlite"
Size: ~50MB (for 10K+ messages)
```

### **Production (Fly.io)**
```bash
Database: PostgreSQL (Separate Fly App)
Provider: "postgresql" 
Connection: postgres://user:pass@host:5432/db
Scalable: Up to 1TB+ storage
```

---

## 🚀 **Production Deployment Steps**

### **Phase 1: Setup Fly Database**

1. **Create PostgreSQL Database on Fly.io:**
```bash
# Create dedicated database app
fly postgres create wtf-whatsapp-db --region sin --vm-size shared-cpu-1x --volume-size 10

# Get connection details
fly postgres connect --database wtf-whatsapp-db
```

2. **Get Database URL:**
```bash
# This will give you the DATABASE_URL
postgresql://postgres:password@wtf-whatsapp-db.internal:5432/wtf_whatsapp_db
```

### **Phase 2: Configure Production Schema**

1. **Switch to PostgreSQL Schema:**
```bash
# Backup current schema
cp backend/prisma/schema.prisma backend/prisma/schema.dev.prisma

# Use production schema (PostgreSQL)
cp backend/prisma/schema.prod.prisma backend/prisma/schema.prisma
```

2. **Update Database Provider:**
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### **Phase 3: Deploy Application**

1. **Set Environment Variables:**
```bash
fly secrets set NODE_ENV=production
fly secrets set DATABASE_URL="postgresql://postgres:password@host:5432/db"
fly secrets set TOGETHER_API_KEY="your_api_key"
fly secrets set CORS_ORIGIN="https://wtf-whatsapp-dashboard.fly.dev"
```

2. **Deploy Application:**
```bash
# Automated deployment
npm run deploy:prod

# Manual deployment
fly deploy --config fly.prod.toml
```

3. **Run Database Migration:**
```bash
# SSH into production
fly ssh console -a wtf-whatsapp-dashboard

# Run Prisma migration
cd backend && npx prisma db push
```

---

## 📋 **Database Schema Overview**

### **Main Tables (6 tables):**

| Table | Purpose | Records (Expected) |
|-------|---------|-------------------|
| `messages` | All WhatsApp messages | 100K+ messages |
| `flagged_messages` | Flagged/priority messages | 1K+ flagged |
| `contacts` | WhatsApp contacts | 10K+ contacts |
| `chats` | Chat/group information | 500+ chats |
| `routing_rules` | Auto-routing configuration | 10-50 rules |
| `system_config` | Application settings | 10-20 configs |

### **Storage Requirements:**

| Component | Development | Production |
|-----------|-------------|------------|
| **Database** | 50MB (SQLite) | 1GB+ (PostgreSQL) |
| **Media Files** | Local storage | Fly volumes |
| **Sessions** | Local folder | Fly volumes |
| **Logs** | Console only | Fly logging |

---

## 🔄 **Data Migration (Optional)**

If you want to migrate existing SQLite data to PostgreSQL:

### **Export SQLite Data:**
```bash
cd backend
npx prisma db pull --schema=schema.dev.prisma
npx prisma db seed --schema=schema.dev.prisma
```

### **Import to PostgreSQL:**
```bash
# Export data as JSON
node scripts/export-sqlite-data.js

# Import to PostgreSQL
node scripts/import-to-postgres.js
```

---

## 🔧 **Environment Variables**

### **Development (.env.local):**
```bash
DATABASE_URL="file:./prisma/dev.db"
PORT=3010
CORS_ORIGIN="http://localhost:5010"
```

### **Production (Fly Secrets):**
```bash
DATABASE_URL="postgresql://postgres:password@host:5432/db"
PORT=3000
CORS_ORIGIN="https://wtf-whatsapp-dashboard.fly.dev"
NODE_ENV=production
```

---

## 📈 **Performance Considerations**

### **SQLite vs PostgreSQL:**

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Concurrent Users** | 1-5 users | 100+ users |
| **Database Size** | Up to 1GB | Unlimited |
| **Backup** | File copy | pg_dump |
| **Scaling** | Vertical only | Horizontal |
| **ACID** | ✅ Yes | ✅ Yes |
| **Indexes** | Basic | Advanced |

### **PostgreSQL Indexes Added:**
```sql
-- Performance indexes for production
@@index([timestamp])    -- Message timeline
@@index([fromNumber])   -- User messages
@@index([chatId])       -- Chat messages
@@index([isFlagged])    -- Flagged messages
@@index([status])       -- Message status
@@index([priority])     -- Priority filtering
```

---

## 🛠️ **Troubleshooting**

### **Common Migration Issues:**

1. **Connection Failed:**
```bash
# Check database status
fly status --app wtf-whatsapp-db

# Test connection
fly postgres connect --database wtf-whatsapp-db
```

2. **Schema Mismatch:**
```bash
# Reset and re-migrate
cd backend
npx prisma db push --force-reset
```

3. **Environment Variables:**
```bash
# Check secrets
fly secrets list

# Update secrets
fly secrets set DATABASE_URL="new_url"
```

---

## ✅ **Deployment Checklist**

- [ ] Fly PostgreSQL database created
- [ ] DATABASE_URL configured
- [ ] Production schema applied
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Database migrations run
- [ ] SSL/HTTPS configured
- [ ] Media storage mounted
- [ ] Logging configured
- [ ] Monitoring setup

---

## 🔗 **Useful Commands**

```bash
# Check deployment status
fly status

# View logs
fly logs

# SSH into app
fly ssh console

# Scale app
fly scale count 2

# Database backup
fly postgres backup create --app wtf-whatsapp-db

# Health check
curl https://wtf-whatsapp-dashboard.fly.dev/health
```

---

**🎯 Result:** Your WhatsApp dashboard will run on production-grade PostgreSQL with proper scalability, backup, and monitoring capabilities!