#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that should keep their console.logs for development debugging
const developmentOnlyFiles = [
  'src/pages/TestAuth.tsx',
  'src/pages/Developer.tsx',
  'src/components/NotificationDebugger.tsx',
  'src/components/EnhancedNotificationDebugger.tsx',
  'src/components/EdgeFunctionTest.tsx',
  'src/components/LockerApiDebug.tsx',
  'src/utils/debugEnvVars.ts',
  'src/utils/environmentDebug.ts'
];

// Console methods to wrap in development checks
const consoleMethods = ['console.log', 'console.warn', 'console.info'];

function wrapConsoleStatement(line, method) {
  const indent = line.match(/^(\s*)/)[1];
  const statement = line.trim();
  
  // Skip if already wrapped in development check
  if (line.includes('process.env.NODE_ENV') || line.includes('import.meta.env.DEV')) {
    return line;
  }
  
  // Skip console.error - keep for production error logging
  if (statement.includes('console.error')) {
    return line;
  }
  
  // Wrap in development check
  return `${indent}if (import.meta.env.DEV) {\n${indent}  ${statement}\n${indent}}`;
}

function processFile(filePath) {
  if (developmentOnlyFiles.some(devFile => filePath.includes(devFile))) {
    console.log(`Skipping development file: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const processedLines = [];
  
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let processedLine = line;
    
    // Check if line contains console.log/warn/info
    for (const method of consoleMethods) {
      if (line.includes(method) && !line.includes('//') && !line.includes('/*')) {
        processedLine = wrapConsoleStatement(line, method);
        if (processedLine !== line) {
          modified = true;
          // If we wrapped it, we need to add the wrapped lines
          const wrappedLines = processedLine.split('\n');
          processedLines.push(...wrappedLines);
          break;
        }
      }
    }
    
    // If no modification was made, add the original line
    if (processedLine === line) {
      processedLines.push(line);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, processedLines.join('\n'));
    console.log(`Processed: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

// Process src directory
console.log('🧹 Cleaning up console statements for production...');
processDirectory('src');
console.log('✅ Production cleanup complete!');
