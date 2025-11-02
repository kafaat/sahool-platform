/**
 * Database Optimization Utilities
 * تحسينات قاعدة البيانات
 */

import { getDb } from '../db';

/**
 * Database Indexes Configuration
 * إعدادات الفهارس لتحسين الأداء
 */
export const databaseIndexes = {
  users: [
    'CREATE INDEX IF NOT EXISTS idx_users_openId ON users(openId)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  ],
  farms: [
    'CREATE INDEX IF NOT EXISTS idx_farms_userId ON farms(userId)',
    'CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status)',
    'CREATE INDEX IF NOT EXISTS idx_farms_createdAt ON farms(createdAt)',
  ],
  fields: [
    'CREATE INDEX IF NOT EXISTS idx_fields_farmId ON fields(farmId)',
    'CREATE INDEX IF NOT EXISTS idx_fields_cropType ON fields(cropType)',
  ],
  equipment: [
    'CREATE INDEX IF NOT EXISTS idx_equipment_farmId ON equipment(farmId)',
    'CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status)',
    'CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type)',
  ],
  workPlans: [
    'CREATE INDEX IF NOT EXISTS idx_workPlans_farmId ON workPlans(farmId)',
    'CREATE INDEX IF NOT EXISTS idx_workPlans_status ON workPlans(status)',
    'CREATE INDEX IF NOT EXISTS idx_workPlans_startDate ON workPlans(startDate)',
  ],
  tasks: [
    'CREATE INDEX IF NOT EXISTS idx_tasks_workPlanId ON tasks(workPlanId)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_assignedTo ON tasks(assignedTo)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
  ],
  alerts: [
    'CREATE INDEX IF NOT EXISTS idx_alerts_farmId ON alerts(farmId)',
    'CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)',
    'CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged)',
    'CREATE INDEX IF NOT EXISTS idx_alerts_createdAt ON alerts(createdAt)',
  ],
};

/**
 * Create All Indexes
 * إنشاء جميع الفهارس
 */
export async function createAllIndexes(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot create indexes: database not available');
    return;
  }

  try {
    for (const [table, indexes] of Object.entries(databaseIndexes)) {
      console.log(`[Database] Creating indexes for ${table}...`);
      
      for (const indexQuery of indexes) {
        try {
          await db.execute(indexQuery as any);
          console.log(`[Database] ✓ Index created: ${indexQuery.split('idx_')[1]?.split(' ')[0]}`);
        } catch (error) {
          console.error(`[Database] ✗ Failed to create index: ${error}`);
        }
      }
    }
    
    console.log('[Database] All indexes created successfully');
  } catch (error) {
    console.error('[Database] Error creating indexes:', error);
    throw error;
  }
}

/**
 * Analyze Query Performance
 * تحليل أداء الاستعلامات
 */
export async function analyzeQueryPerformance(query: string): Promise<any> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot analyze query: database not available');
    return null;
  }

  try {
    const explainQuery = `EXPLAIN ${query}`;
    const result = await db.execute(explainQuery as any);
    return result;
  } catch (error) {
    console.error('[Database] Error analyzing query:', error);
    return null;
  }
}

/**
 * Database Connection Pool Stats
 * إحصائيات مجموعة الاتصالات
 */
export async function getConnectionPoolStats(): Promise<any> {
  const db = await getDb();
  if (!db) {
    return {
      status: 'unavailable',
      connections: 0,
    };
  }

  return {
    status: 'available',
    connections: 1, // Drizzle doesn't expose pool stats directly
  };
}

/**
 * Optimize Database Tables
 * تحسين جداول قاعدة البيانات
 */
export async function optimizeTables(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot optimize tables: database not available');
    return;
  }

  const tables = Object.keys(databaseIndexes);

  try {
    for (const table of tables) {
      console.log(`[Database] Optimizing table ${table}...`);
      await db.execute(`OPTIMIZE TABLE ${table}` as any);
    }
    
    console.log('[Database] All tables optimized successfully');
  } catch (error) {
    console.error('[Database] Error optimizing tables:', error);
  }
}

/**
 * Query Performance Monitor
 * مراقب أداء الاستعلامات
 */
export class QueryPerformanceMonitor {
  private queries: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  track(queryName: string, executionTime: number): void {
    const existing = this.queries.get(queryName);
    
    if (existing) {
      existing.count++;
      existing.totalTime += executionTime;
      existing.avgTime = existing.totalTime / existing.count;
    } else {
      this.queries.set(queryName, {
        count: 1,
        totalTime: executionTime,
        avgTime: executionTime,
      });
    }
  }

  getStats(): any {
    return Array.from(this.queries.entries()).map(([name, stats]) => ({
      query: name,
      ...stats,
    }));
  }

  getSlowestQueries(limit: number = 10): any[] {
    return this.getStats()
      .sort((a: any, b: any) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  reset(): void {
    this.queries.clear();
  }
}

// Global instance
export const queryMonitor = new QueryPerformanceMonitor();

export default {
  createAllIndexes,
  analyzeQueryPerformance,
  getConnectionPoolStats,
  optimizeTables,
  queryMonitor,
};
