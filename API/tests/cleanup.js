#!/usr/bin/env bun

/**
 * Test Cleanup Script
 * 
 * This script cleans up test data and resets the test environment.
 */

import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { cleanupTestData, TEST_CONFIG } from './setup.js';
import { createTestDbConnection, closeTestDbConnection } from './testConfig.js';

/**
 * Remove test environment file
 */
function removeTestEnv() {
  try {
    if (existsSync('.env.test')) {
      unlinkSync('.env.test');
      console.log('✅ Removed .env.test file');
    }
  } catch (error) {
    console.warn('⚠️ Could not remove .env.test:', error.message);
  }
}

/**
 * Kill any running test processes
 */
function killTestProcesses() {
  try {
    // Kill processes on test port
    execSync('lsof -ti:3001 | xargs kill -9', { stdio: 'pipe' });
    console.log('✅ Killed processes on port 3001');
  } catch (error) {
    // Process may not exist
  }
}

/**
 * Drop test database
 */
async function dropTestDatabase() {
  try {
    console.log('🗄️ Dropping test database...');
    
    // Connect to MongoDB
    const connection = await createTestDbConnection();
    
    if (connection) {
      // Drop the test database
      await connection.db.dropDatabase();
      console.log('✅ Test database dropped');
      
      // Close connection
      await closeTestDbConnection();
    } else {
      console.warn('⚠️ Could not connect to database to drop it');
    }
  } catch (error) {
    console.warn('⚠️ Could not drop test database:', error.message);
  }
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('🧹 Starting test cleanup...\n');
  
  // Kill any running processes
  console.log('📋 Step 1: Killing test processes...');
  killTestProcesses();
  console.log('');
  
  // Clean up test data
  console.log('📋 Step 2: Cleaning test data...');
  await cleanupTestData();
  console.log('');
  
  // Remove test environment
  console.log('📋 Step 3: Removing test environment...');
  removeTestEnv();
  console.log('');
  
  // Drop test database (optional)
  if (process.argv.includes('--drop-db')) {
    console.log('📋 Step 4: Dropping test database...');
    await dropTestDatabase();
    console.log('');
  }
  
  console.log('✅ Test cleanup completed!');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Test Cleanup Script

Usage:
  bun run tests/cleanup.js [options]

Options:
  --drop-db    Also drop the test database
  --help, -h   Show this help message

Examples:
  bun run tests/cleanup.js              # Basic cleanup
  bun run tests/cleanup.js --drop-db    # Cleanup with database drop
  `);
  process.exit(0);
}

// Run cleanup
cleanup().catch(console.error); 