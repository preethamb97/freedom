#!/usr/bin/env bun

/**
 * Integration Test Runner
 * 
 * This script orchestrates the complete integration testing process:
 * 1. Sets up test environment
 * 2. Starts test server
 * 3. Runs integration tests
 * 4. Cleans up resources
 */

import { spawn } from 'child_process';
import { setupTests, teardownTests, waitForServer } from './setup.js';

const API_PORT = 3001;
const TEST_TIMEOUT = 60000; // 60 seconds

/**
 * Kill process by port
 */
function killProcessByPort(port) {
  try {
    const { execSync } = require('child_process');
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'pipe' });
    console.log(`✅ Killed processes on port ${port}`);
  } catch (error) {
    // Process may not exist
  }
}

/**
 * Start the API server for testing
 */
function startApiServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting API server for testing...');
    
    // Kill any existing processes on the port
    killProcessByPort(API_PORT);
    
    // Start server with test environment
    const serverProcess = spawn('bun', ['run', '--env-file=.env.test', 'src/server.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        MOCK_GOOGLE_AUTH: 'true',
        PORT: API_PORT.toString()
      }
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running') || output.includes('listening')) {
        console.log('✅ API server started successfully');
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏳ Server start timeout - continuing anyway...');
      resolve(serverProcess);
    }, 10000);
  });
}

/**
 * Run the integration tests
 */
function runIntegrationTests() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Running integration tests...');
    
    const testProcess = spawn('bun', ['test', 'tests/integration.test.js'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        MOCK_GOOGLE_AUTH: 'true'
      }
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All integration tests passed!');
        resolve();
      } else {
        console.error(`❌ Tests failed with exit code ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error('❌ Test execution error:', error);
      reject(error);
    });
  });
}

/**
 * Main test execution function
 */
async function runTests() {
  let serverProcess = null;
  
  try {
    console.log('🎯 Starting complete integration test suite...\n');
    
    // Step 1: Setup test environment
    console.log('📋 Step 1: Setting up test environment...');
    await setupTests();
    console.log('');
    
    // Step 2: Start API server
    console.log('📋 Step 2: Starting API server...');
    serverProcess = await startApiServer();
    
    // Wait for server to be ready
    await waitForServer(API_PORT);
    console.log('');
    
    // Step 3: Run integration tests
    console.log('📋 Step 3: Running integration tests...');
    await runIntegrationTests();
    console.log('');
    
    // Step 4: Cleanup
    console.log('📋 Step 4: Cleaning up...');
    
    console.log('🎉 All tests completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
    
  } finally {
    // Cleanup: Kill server process
    if (serverProcess) {
      console.log('🛑 Stopping test server...');
      serverProcess.kill('SIGTERM');
      
      // Force kill after timeout
      setTimeout(() => {
        if (!serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
      }, 5000);
    }
    
    // Kill any remaining processes on the port
    killProcessByPort(API_PORT);
    
    // Cleanup test data
    try {
      await teardownTests();
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }
}

/**
 * Handle process signals
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  killProcessByPort(API_PORT);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  killProcessByPort(API_PORT);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error('❌ Unhandled error:', error);
  killProcessByPort(API_PORT);
  process.exit(1);
}); 