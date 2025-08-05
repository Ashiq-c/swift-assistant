#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting optimized Vercel build...');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('rm -rf .svelte-kit build .vercel/output node_modules/.vite', { stdio: 'inherit' });
} catch (error) {
  console.log('No previous builds to clean');
}

// Set environment variables for optimization
process.env.NODE_ENV = 'production';
process.env.VITE_BUILD_TARGET = 'vercel';
process.env.DISABLE_ESLINT_PLUGIN = 'true';

// Build the project with optimizations
console.log('📦 Building project with optimizations...');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Optimize build output
console.log('🔧 Optimizing build output...');
try {
  const outputPath = '.vercel/output';
  if (fs.existsSync(outputPath)) {
    // Remove source maps if they exist
    execSync(`find ${outputPath} -name "*.map" -delete`, { stdio: 'inherit' });
    
    // Check build size
    console.log('📊 Checking build size...');
    execSync(`du -sh ${outputPath}`, { stdio: 'inherit' });
  }
} catch (error) {
  console.log('Could not optimize build output');
}

console.log('✅ Build completed successfully!');
console.log('💡 If deployment still fails due to size, consider removing heavy dependencies or using dynamic imports.');