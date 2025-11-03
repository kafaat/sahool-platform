import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const db = drizzle(process.env.DATABASE_URL);

const indexes = [
  // Users table indexes
  { table: 'users', column: 'openId', name: 'idx_users_openId' },
  { table: 'users', column: 'email', name: 'idx_users_email' },
  { table: 'users', column: 'role', name: 'idx_users_role' },
  { table: 'users', column: 'createdAt', name: 'idx_users_createdAt' },
  
  // Farms table indexes
  { table: 'farms', column: 'userId', name: 'idx_farms_userId' },
  { table: 'farms', column: 'status', name: 'idx_farms_status' },
  { table: 'farms', column: 'createdAt', name: 'idx_farms_createdAt' },
  
  // Fields table indexes
  { table: 'fields', column: 'farmId', name: 'idx_fields_farmId' },
  { table: 'fields', column: 'cropType', name: 'idx_fields_cropType' },
  { table: 'fields', column: 'status', name: 'idx_fields_status' },
  
  // Equipment table indexes
  { table: 'equipment', column: 'farmId', name: 'idx_equipment_farmId' },
  { table: 'equipment', column: 'type', name: 'idx_equipment_type' },
  { table: 'equipment', column: 'status', name: 'idx_equipment_status' },
  
  // Work plans table indexes
  { table: 'workPlans', column: 'farmId', name: 'idx_workPlans_farmId' },
  { table: 'workPlans', column: 'fieldId', name: 'idx_workPlans_fieldId' },
  { table: 'workPlans', column: 'status', name: 'idx_workPlans_status' },
  { table: 'workPlans', column: 'startDate', name: 'idx_workPlans_startDate' },
  
  // Tasks table indexes
  { table: 'tasks', column: 'workPlanId', name: 'idx_tasks_workPlanId' },
  { table: 'tasks', column: 'assignedTo', name: 'idx_tasks_assignedTo' },
  { table: 'tasks', column: 'status', name: 'idx_tasks_status' },
  { table: 'tasks', column: 'dueDate', name: 'idx_tasks_dueDate' },
  
  // Alerts table indexes
  { table: 'alerts', column: 'farmId', name: 'idx_alerts_farmId' },
  { table: 'alerts', column: 'userId', name: 'idx_alerts_userId' },
  { table: 'alerts', column: 'type', name: 'idx_alerts_type' },
  { table: 'alerts', column: 'severity', name: 'idx_alerts_severity' },
  { table: 'alerts', column: 'status', name: 'idx_alerts_status' },
  { table: 'alerts', column: 'createdAt', name: 'idx_alerts_createdAt' },
  
  // Drone images table indexes
  { table: 'droneImages', column: 'farmId', name: 'idx_droneImages_farmId' },
  { table: 'droneImages', column: 'fieldId', name: 'idx_droneImages_fieldId' },
  { table: 'droneImages', column: 'uploadedBy', name: 'idx_droneImages_uploadedBy' },
  { table: 'droneImages', column: 'capturedAt', name: 'idx_droneImages_capturedAt' },
  { table: 'droneImages', column: 'createdAt', name: 'idx_droneImages_createdAt' },
  
  // Processing jobs table indexes
  { table: 'processingJobs', column: 'imageId', name: 'idx_processingJobs_imageId' },
  { table: 'processingJobs', column: 'status', name: 'idx_processingJobs_status' },
  { table: 'processingJobs', column: 'createdAt', name: 'idx_processingJobs_createdAt' },
  
  // NDVI analysis table indexes
  { table: 'ndviAnalysis', column: 'imageId', name: 'idx_ndviAnalysis_imageId' },
  { table: 'ndviAnalysis', column: 'farmId', name: 'idx_ndviAnalysis_farmId' },
  { table: 'ndviAnalysis', column: 'fieldId', name: 'idx_ndviAnalysis_fieldId' },
  { table: 'ndviAnalysis', column: 'createdAt', name: 'idx_ndviAnalysis_createdAt' },
  
  // Pest detections table indexes
  { table: 'pestDetections', column: 'imageId', name: 'idx_pestDetections_imageId' },
  { table: 'pestDetections', column: 'farmId', name: 'idx_pestDetections_farmId' },
  { table: 'pestDetections', column: 'fieldId', name: 'idx_pestDetections_fieldId' },
  { table: 'pestDetections', column: 'severity', name: 'idx_pestDetections_severity' },
  { table: 'pestDetections', column: 'createdAt', name: 'idx_pestDetections_createdAt' },
  
  // Water stress analysis table indexes
  { table: 'waterStressAnalysis', column: 'imageId', name: 'idx_waterStressAnalysis_imageId' },
  { table: 'waterStressAnalysis', column: 'farmId', name: 'idx_waterStressAnalysis_farmId' },
  { table: 'waterStressAnalysis', column: 'fieldId', name: 'idx_waterStressAnalysis_fieldId' },
  { table: 'waterStressAnalysis', column: 'stressLevel', name: 'idx_waterStressAnalysis_stressLevel' },
  
  // Disease detections table indexes
  { table: 'disease_detections', column: 'farmId', name: 'idx_disease_detections_farmId' },
  { table: 'disease_detections', column: 'fieldId', name: 'idx_disease_detections_fieldId' },
  { table: 'disease_detections', column: 'uploadedBy', name: 'idx_disease_detections_uploadedBy' },
  { table: 'disease_detections', column: 'status', name: 'idx_disease_detections_status' },
  { table: 'disease_detections', column: 'createdAt', name: 'idx_disease_detections_createdAt' },
  
  // Detected diseases table indexes
  { table: 'detected_diseases', column: 'detectionId', name: 'idx_detected_diseases_detectionId' },
  { table: 'detected_diseases', column: 'diseaseId', name: 'idx_detected_diseases_diseaseId' },
  { table: 'detected_diseases', column: 'severity', name: 'idx_detected_diseases_severity' },
  
  // Disease database table indexes
  { table: 'disease_database', column: 'cropType', name: 'idx_disease_database_cropType' },
  { table: 'disease_database', column: 'severity', name: 'idx_disease_database_severity' },
];

async function addIndexes() {
  console.log('🔧 بدء إضافة فهارس قاعدة البيانات...\n');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const index of indexes) {
      try {
        // Check if index already exists
        const [rows] = await connection.query(
          `SHOW INDEX FROM ${index.table} WHERE Key_name = ?`,
          [index.name]
        );
        
        if (Array.isArray(rows) && rows.length > 0) {
          console.log(`⏭️  ${index.name} (موجود بالفعل)`);
          skipCount++;
          continue;
        }
        
        // Create index
        await connection.query(
          `CREATE INDEX ${index.name} ON ${index.table}(${index.column})`
        );
        console.log(`✅ ${index.name}`);
        successCount++;
      } catch (error) {
        console.error(`❌ فشل: ${index.name} - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ تمت إضافة ${successCount} فهرس جديد`);
    console.log(`⏭️  تم تخطي ${skipCount} فهرس (موجود بالفعل)`);
    if (errorCount > 0) {
      console.log(`❌ فشل ${errorCount} فهرس`);
    }
    console.log(`📊 المجموع الكلي: ${indexes.length} فهرس`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('\n❌ خطأ عام في إضافة الفهارس:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// تشغيل السكريبت
addIndexes()
  .then(() => {
    console.log('🎉 اكتملت إضافة الفهارس بنجاح!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشلت إضافة الفهارس:', error.message);
    process.exit(1);
  });
