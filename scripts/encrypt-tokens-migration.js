/**
 * One-Time Migration Script: Encrypt Existing Twilio Auth Tokens
 * 
 * USAGE:
 * 1. Ensure ENCRYPTION_KEY and ENCRYPTION_IV are set in your environment
 * 2. Run: node scripts/encrypt-tokens-migration.js
 * 
 * This script:
 * - Fetches all restaurants with twilioConfig
 * - Encrypts plain-text authTokens
 * - Updates Firestore with encrypted tokens
 * - Logs progress and errors
 * 
 * SAFETY: This script is idempotent (won't re-encrypt already encrypted tokens)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { encryptToken, isEncrypted } from '../src/utils/encryption.ts';
import * as fs from 'fs';
import * as path from 'path';

// Load service account
const serviceAccountPath = path.join(process.cwd(), 'menu-cards-cb78c-firebase-adminsdk-fbsvc-b2c07203aa.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function migrateTokens() {
  console.log('🔐 Starting token encryption migration...\n');

  try {
    // Fetch all restaurants
    const restaurantsSnapshot = await db.collection('restaurants').get();

    if (restaurantsSnapshot.empty) {
      console.log('ℹ️  No restaurants found.');
      return;
    }

    console.log(`📊 Found ${restaurantsSnapshot.size} restaurants\n`);

    let totalRestaurants = 0;
    let alreadyEncrypted = 0;
    let successfullyEncrypted = 0;
    let errors = 0;

    for (const restaurantDoc of restaurantsSnapshot.docs) {
      totalRestaurants++;
      const restaurantData = restaurantDoc.data();
      const restaurantCode = restaurantData.restaurantCode || restaurantDoc.id;

      // Skip if no twilioConfig
      if (!restaurantData.twilioConfig) {
        console.log(`⏭️  [${restaurantCode}] No twilioConfig found. Skipping.`);
        continue;
      }

      const { twilioConfig } = restaurantData;

      // Skip if no authToken
      if (!twilioConfig.authToken) {
        console.log(`⏭️  [${restaurantCode}] No authToken found. Skipping.`);
        continue;
      }

      // Check if already encrypted
      if (isEncrypted(twilioConfig.authToken)) {
        console.log(`✓ [${restaurantCode}] Token already encrypted. Skipping.`);
        alreadyEncrypted++;
        continue;
      }

      // Encrypt the token
      try {
        console.log(`🔒 [${restaurantCode}] Encrypting token...`);
        const encryptedToken = encryptToken(twilioConfig.authToken);

        // Update Firestore
        await restaurantDoc.ref.update({
          'twilioConfig.authToken': encryptedToken,
          'twilioConfig.tokenEncryptedAt': new Date().toISOString(),
        });

        console.log(`✅ [${restaurantCode}] Successfully encrypted and updated\n`);
        successfullyEncrypted++;
      } catch (error) {
        console.error(`❌ [${restaurantCode}] Error encrypting token:`, error.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Restaurants:        ${totalRestaurants}`);
    console.log(`Already Encrypted:        ${alreadyEncrypted}`);
    console.log(`Successfully Encrypted:   ${successfullyEncrypted}`);
    console.log(`Errors:                   ${errors}`);
    console.log('='.repeat(60) + '\n');

    if (errors > 0) {
      console.log('⚠️  Some tokens failed to encrypt. Check errors above.');
      process.exit(1);
    } else {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateTokens();
