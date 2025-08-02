#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * Checks if the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_PAYSTACK_PUBLIC_KEY'
];

// Optional but recommended environment variables
const OPTIONAL_ENV_VARS = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_COURIER_GUY_API_KEY',
  'VITE_APP_URL'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const missing = [];
  const optional = [];
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!process.env[envVar]) {
      optional.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(env => console.error(`   - ${env}`));
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  
  if (optional.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    optional.forEach(env => console.warn(`   - ${env}`));
  }
  
  return true;
}

function checkProductionFiles() {
  console.log('🔍 Checking production files...');
  
  const requiredFiles = [
    'dist/index.html',
    'public/robots.txt',
    'public/sitemap.xml',
    'vercel.json'
  ];
  
  const missing = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missing.push(file);
    }
  }
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing recommended files:');
    missing.forEach(file => console.warn(`   - ${file}`));
  } else {
    console.log('✅ All production files present');
  }
  
  return missing.length === 0;
}

function checkPackageJson() {
  console.log('🔍 Checking package.json configuration...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts.build) {
    console.error('❌ Missing build script in package.json');
    return false;
  }
  
  console.log('✅ Package.json configuration looks good');
  return true;
}

function main() {
  console.log('🚀 Production Readiness Validation\n');
  
  let allChecks = true;
  
  allChecks &= checkEnvironmentVariables();
  allChecks &= checkPackageJson();
  checkProductionFiles(); // Don't fail on missing files, just warn
  
  console.log('\n' + '='.repeat(50));
  
  if (allChecks) {
    console.log('🎉 Production validation passed!');
    console.log('Your application is ready for production deployment.');
    console.log('\nNext steps:');
    console.log('1. Run: npm run build:prod');
    console.log('2. Deploy to your hosting platform');
    console.log('3. Set environment variables in production');
    process.exit(0);
  } else {
    console.log('❌ Production validation failed!');
    console.log('Please fix the issues above before deploying.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
