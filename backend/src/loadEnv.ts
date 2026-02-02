/**
 * Load environment variables BEFORE any other imports
 * This file must be imported first in index.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try local .env first, then parent directory
const localEnvPath = path.join(__dirname, '../.env');
const parentEnvPath = path.join(process.cwd(), '../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
  console.log(`✅ Loaded .env from: ${localEnvPath}`);
} else {
  dotenv.config({ path: parentEnvPath });
  console.log(`✅ Loaded .env from: ${parentEnvPath}`);
}

// Log JWT_SECRET status
if (process.env.JWT_SECRET) {
  console.log('✅ JWT_SECRET loaded successfully');
} else {
  console.error('❌ JWT_SECRET not found in environment!');
}
