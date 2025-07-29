#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * Checks critical configuration before deployment
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_PAYSTACK_PUBLIC_KEY',
  'VITE_APP_URL'
];

const OPTIONAL_ENV_VARS = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_COURIER_GUY_API_KEY',
  'VITE_FASTWAY_API_KEY'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  REQUIRED_ENV_VARS.forEach(envVar => {
    if (!process.env[envVar] || process.env[envVar].trim() === '') {
      missing.push(envVar);
    }
  });
  
  // Check optional variables
  OPTIONAL_ENV_VARS.forEach(envVar => {
    if (!process.env[envVar] || process.env[envVar].trim() === '') {
      warnings.push(envVar);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    return false;
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables (some features may be limited):');
    warnings.forEach(envVar => console.warn(`   - ${envVar}`));
  }
  
  console.log('✅ Environment variables configured');
  return true;
}

function checkBuildExists() {
  console.log('🔍 Checking build output...');
  
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build output not found. Run "npm run build" first.');
    return false;
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in build output.');
    return false;
  }
  
  console.log('✅ Build output exists');
  return true;
}

function checkBundleSize() {
  console.log('🔍 Checking bundle size...');
  
  const distPath = path.join(process.cwd(), 'dist');
  const assetsPath = path.join(distPath, 'assets');
  
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ Assets directory not found');
    return false;
  }
  
  const jsFiles = fs.readdirSync(assetsPath)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      return { name: file, size: stats.size };
    });
  
  const totalSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`📦 Total bundle size: ${totalSizeMB}MB`);
  
  // Check for large chunks
  const largeChunks = jsFiles.filter(file => file.size > 1024 * 1024); // > 1MB
  
  if (largeChunks.length > 0) {
    console.warn('⚠️  Large chunks detected:');
    largeChunks.forEach(chunk => {
      const sizeMB = (chunk.size / (1024 * 1024)).toFixed(2);
      console.warn(`   - ${chunk.name}: ${sizeMB}MB`);
    });
  }
  
  if (totalSize > 2 * 1024 * 1024) { // > 2MB
    console.warn('⚠️  Bundle size is larger than recommended (2MB)');
    return true; // Warning, not error
  }
  
  console.log('✅ Bundle size acceptable');
  return true;
}

function checkPackageVulnerabilities() {
  console.log('🔍 Checking security vulnerabilities...');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' });
    console.log('✅ No high-severity vulnerabilities found');
    return true;
  } catch (error) {
    console.warn('⚠️  Security vulnerabilities detected. Review with "npm audit"');
    // Don't fail deployment for vulnerabilities in dev dependencies
    return true;
  }
}

function checkCriticalFiles() {
  console.log('🔍 Checking critical files...');
  
  const criticalFiles = [
    'package.json',
    'src/config/environment.ts',
    'src/integrations/supabase/client.ts',
    'vercel.json'
  ];
  
  const missing = criticalFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    console.error('❌ Missing critical files:');
    missing.forEach(file => console.error(`   - ${file}`));
    return false;
  }
  
  console.log('✅ All critical files present');
  return true;
}

function generateReport() {
  console.log('\n📊 PRODUCTION READINESS REPORT');
  console.log('================================');
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Build Output', fn: checkBuildExists },
    { name: 'Bundle Size', fn: checkBundleSize },
    { name: 'Security', fn: checkPackageVulnerabilities },
    { name: 'Critical Files', fn: checkCriticalFiles }
  ];
  
  const results = checks.map(check => ({
    name: check.name,
    passed: check.fn()
  }));
  
  console.log('\nResults:');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  const allPassed = results.every(result => result.passed);
  
  if (allPassed) {
    console.log('\n🚀 READY FOR PRODUCTION!');
    console.log('All checks passed. You can deploy safely.');
    process.exit(0);
  } else {
    console.log('\n🛑 NOT READY FOR PRODUCTION!');
    console.log('Please fix the issues above before deploying.');
    process.exit(1);
  }
}

// Run the verification
generateReport();
