/**
 * Load environment variables BEFORE any other imports
 * This file must be imported first in index.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load from project root .env
const rootEnvPath = path.join(__dirname, '../../.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  console.log(`✅ Loaded .env from: ${rootEnvPath}`);
} else if (Object.keys(process.env).some((key) => key === 'MONGODB_URI' || key === 'JWT_SECRET')) {
  // Container deployments inject the variables through the environment (compose env_file),
  // so a missing .env file is expected and not an error.
  console.log('ℹ️ No .env file found — using environment variables from the container');
} else {
  console.error(`❌ .env file not found at: ${rootEnvPath}`);
}

// Log JWT_SECRET status
if (process.env.JWT_SECRET) {
  console.log('✅ JWT_SECRET loaded successfully');
} else {
  console.error('❌ JWT_SECRET not found in environment!');
}
