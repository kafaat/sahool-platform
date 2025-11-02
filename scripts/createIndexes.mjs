/**
 * Create Database Indexes Script
 * سكريبت إنشاء فهارس قاعدة البيانات
 */

import { createAllIndexes } from '../server/middleware/databaseOptimization.js';

console.log('🚀 Starting database indexes creation...\n');

try {
  await createAllIndexes();
  console.log('\n✅ All indexes created successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error creating indexes:', error);
  process.exit(1);
}
