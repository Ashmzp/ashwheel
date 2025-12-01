/**
 * Automatic Backup System
 * Prevents data loss by creating periodic backups
 */

import { supabase } from '@/lib/customSupabaseClient';

let backupInterval = null;

/**
 * Schedule automatic backups
 * @param {string} userId - User ID
 * @param {number} intervalHours - Backup interval in hours (default: 24)
 */
export const scheduleAutoBackup = (userId, intervalHours = 24) => {
  // Clear existing interval if any
  if (backupInterval) {
    clearInterval(backupInterval);
  }

  // Run initial backup after 5 minutes
  setTimeout(() => {
    performBackup(userId);
  }, 5 * 60 * 1000);

  // Schedule periodic backups
  backupInterval = setInterval(async () => {
    await performBackup(userId);
  }, intervalHours * 60 * 60 * 1000);

  console.log(`✅ Auto backup scheduled every ${intervalHours} hours`);
};

/**
 * Perform backup of all user data
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const performBackup = async (userId) => {
  try {
    console.log('🔄 Starting backup...');

    const tables = [
      'customers',
      'invoices',
      'vehicle_invoices',
      'purchases',
      'inventory',
      'receipts',
      'journal_entries',
      'job_cards'
    ];

    const backupData = {};
    let totalRecords = 0;

    // Fetch data from each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .limit(1000); // Limit to prevent huge backups

        if (error) {
          console.warn(`Backup warning for ${table}:`, error.message);
          backupData[table] = [];
        } else {
          backupData[table] = data || [];
          totalRecords += data?.length || 0;
        }
      } catch (tableError) {
        console.warn(`Error backing up ${table}:`, tableError);
        backupData[table] = [];
      }
    }

    // Store backup in database
    const { error: insertError } = await supabase
      .from('backups')
      .insert({
        user_id: userId,
        backup_data: backupData,
        record_count: totalRecords,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Backup failed:', insertError);
      return false;
    }

    console.log(`✅ Backup completed: ${totalRecords} records backed up`);
    
    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups(userId, 30);
    
    return true;
  } catch (error) {
    console.error('❌ Backup error:', error);
    return false;
  }
};

/**
 * Clean up old backups
 * @param {string} userId - User ID
 * @param {number} daysToKeep - Number of days to keep backups
 */
export const cleanupOldBackups = async (userId, daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('backups')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.warn('Cleanup warning:', error);
    } else {
      console.log('🧹 Old backups cleaned up');
    }
  } catch (error) {
    console.warn('Cleanup error:', error);
  }
};

/**
 * Restore data from backup
 * @param {string} backupId - Backup ID
 * @returns {Promise<boolean>} - Success status
 */
export const restoreFromBackup = async (backupId) => {
  try {
    console.log('🔄 Starting restore...');

    // Fetch backup data
    const { data: backup, error } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      console.error('❌ Backup not found:', error);
      return false;
    }

    const backupData = backup.backup_data;
    let restoredCount = 0;

    // Restore each table
    for (const [table, records] of Object.entries(backupData)) {
      if (records && records.length > 0) {
        try {
          const { error: insertError } = await supabase
            .from(table)
            .upsert(records, { onConflict: 'id' });

          if (insertError) {
            console.warn(`Restore warning for ${table}:`, insertError);
          } else {
            restoredCount += records.length;
          }
        } catch (tableError) {
          console.warn(`Error restoring ${table}:`, tableError);
        }
      }
    }

    console.log(`✅ Restore completed: ${restoredCount} records restored`);
    return true;
  } catch (error) {
    console.error('❌ Restore error:', error);
    return false;
  }
};

/**
 * Get list of available backups
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of backups
 */
export const getBackupList = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('backups')
      .select('id, created_at, record_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching backups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching backups:', error);
    return [];
  }
};

/**
 * Stop automatic backups
 */
export const stopAutoBackup = () => {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log('🛑 Auto backup stopped');
  }
};

export default {
  scheduleAutoBackup,
  performBackup,
  restoreFromBackup,
  getBackupList,
  stopAutoBackup,
  cleanupOldBackups
};
