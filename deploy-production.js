#!/usr/bin/env node

/**
 * Production Deployment Script for Fly.io
 * Handles database setup and application deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Production Deployment to Fly.io...\n');

// Step 1: Prepare database
console.log('📊 Step 1: Setting up PostgreSQL database...');
try {
  // Create Fly database if not exists
  console.log('Creating Fly PostgreSQL database...');
  execSync('fly postgres create wtf-whatsapp-db --region sin --vm-size shared-cpu-1x --volume-size 10', { stdio: 'inherit' });
  
  // Get database URL
  console.log('Getting database connection URL...');
  const dbUrl = execSync('fly postgres connect --database wtf-whatsapp-db --app wtf-whatsapp-db', { encoding: 'utf-8' });
  console.log('✅ Database created successfully\n');
} catch (error) {
  console.log('ℹ️ Database might already exist, continuing...\n');
}

// Step 2: Switch to production schema
console.log('📝 Step 2: Preparing production schema...');
try {
  // Copy production schema
  const prodSchema = path.join(__dirname, 'backend/prisma/schema.prod.prisma');
  const devSchema = path.join(__dirname, 'backend/prisma/schema.prisma');
  
  // Backup current schema
  if (fs.existsSync(devSchema)) {
    fs.copyFileSync(devSchema, devSchema + '.backup');
    console.log('✅ Backed up development schema');
  }
  
  // Copy production schema
  if (fs.existsSync(prodSchema)) {
    fs.copyFileSync(prodSchema, devSchema);
    console.log('✅ Switched to production schema (PostgreSQL)');
  }
} catch (error) {
  console.error('❌ Error preparing schema:', error.message);
  process.exit(1);
}

// Step 3: Set production environment variables
console.log('🔧 Step 3: Setting environment variables...');
try {
  // Set required secrets
  execSync('fly secrets set NODE_ENV=production', { stdio: 'inherit' });
  execSync('fly secrets set PORT=3000', { stdio: 'inherit' });
  
  console.log('⚠️ MANUAL STEP REQUIRED:');
  console.log('Please set the following secrets manually:');
  console.log('fly secrets set DATABASE_URL="your_postgres_connection_url"');
  console.log('fly secrets set TOGETHER_API_KEY="your_together_ai_key"');
  console.log('fly secrets set CORS_ORIGIN="https://your-app-name.fly.dev"');
  console.log('');
} catch (error) {
  console.error('❌ Error setting environment variables:', error.message);
}

// Step 4: Build and generate database
console.log('🔨 Step 4: Building application...');
try {
  console.log('Installing dependencies...');
  execSync('cd backend && npm install --production', { stdio: 'inherit' });
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  console.log('Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  
  console.log('Generating Prisma client...');
  execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Application built successfully\n');
} catch (error) {
  console.error('❌ Error building application:', error.message);
  process.exit(1);
}

// Step 5: Deploy to Fly.io
console.log('🚁 Step 5: Deploying to Fly.io...');
try {
  execSync('fly deploy --config fly.prod.toml', { stdio: 'inherit' });
  console.log('✅ Application deployed successfully\n');
} catch (error) {
  console.error('❌ Error deploying application:', error.message);
  process.exit(1);
}

// Step 6: Run database migrations
console.log('🗄️ Step 6: Running database migrations...');
try {
  console.log('⚠️ MANUAL STEP REQUIRED:');
  console.log('After setting DATABASE_URL, run:');
  console.log('fly ssh console -a wtf-whatsapp-dashboard');
  console.log('cd backend && npx prisma db push');
  console.log('');
} catch (error) {
  console.error('❌ Error with database migrations:', error.message);
}

// Step 7: Restore development schema
console.log('🔄 Step 7: Restoring development environment...');
try {
  const devSchemaBackup = path.join(__dirname, 'backend/prisma/schema.prisma.backup');
  const devSchema = path.join(__dirname, 'backend/prisma/schema.prisma');
  
  if (fs.existsSync(devSchemaBackup)) {
    fs.copyFileSync(devSchemaBackup, devSchema);
    fs.unlinkSync(devSchemaBackup);
    console.log('✅ Restored development schema (SQLite)');
  }
} catch (error) {
  console.error('❌ Error restoring development schema:', error.message);
}

console.log('\n🎉 Production deployment completed!');
console.log('\n📋 Next steps:');
console.log('1. Set DATABASE_URL secret with your PostgreSQL connection string');
console.log('2. Set TOGETHER_API_KEY secret');
console.log('3. Run database migrations via SSH');
console.log('4. Test your production application');
console.log('\n🔗 Your app will be available at: https://wtf-whatsapp-dashboard.fly.dev');