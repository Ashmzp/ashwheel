#!/bin/bash

#############################################
# Supabase Automatic Backup Setup Script
# Run this once to setup daily backups
#############################################

echo "🔄 Supabase Backup Setup"
echo "========================"
echo ""

# Get Postgres password
echo "📝 Step 1: Getting Postgres password..."
DB_CONTAINER=$(docker ps | grep supabase-db | awk '{print $1}')
DB_PASS=$(docker exec $DB_CONTAINER env | grep POSTGRES_PASSWORD | cut -d'=' -f2)

if [ -z "$DB_PASS" ]; then
    echo "❌ Could not find Postgres password!"
    echo "Please enter manually:"
    read -s DB_PASS
fi

echo "✅ Password found"
echo ""

# Create backup directory
echo "📁 Step 2: Creating backup directory..."
mkdir -p /root/supabase-backups
echo "✅ Directory created: /root/supabase-backups"
echo ""

# Create backup script
echo "📝 Step 3: Creating backup script..."
cat > /root/supabase-backup.sh << 'SCRIPT_END'
#!/bin/bash

# Supabase Complete Backup Script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/supabase-backups"
DB_CONTAINER=$(docker ps | grep supabase-db | awk '{print $1}')
DB_USER="postgres"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Log start
echo "========================================" | tee -a /var/log/supabase-backup.log
echo "Backup started at: $(date)" | tee -a /var/log/supabase-backup.log

# Backup database
echo "Creating database backup..." | tee -a /var/log/supabase-backup.log
docker exec $DB_CONTAINER pg_dumpall -U $DB_USER > $BACKUP_DIR/backup_$DATE.sql

# Check if successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup successful" | tee -a /var/log/supabase-backup.log
    
    # Compress
    gzip $BACKUP_DIR/backup_$DATE.sql
    
    # Get size
    BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.sql.gz | cut -f1)
    echo "Backup size: $BACKUP_SIZE" | tee -a /var/log/supabase-backup.log
    
    # Delete old backups
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Count backups
    BACKUP_COUNT=$(ls -1 $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | wc -l)
    echo "Total backups: $BACKUP_COUNT" | tee -a /var/log/supabase-backup.log
    
    echo "✅ Backup completed!" | tee -a /var/log/supabase-backup.log
else
    echo "❌ Backup failed!" | tee -a /var/log/supabase-backup.log
    exit 1
fi

echo "========================================" | tee -a /var/log/supabase-backup.log
SCRIPT_END

chmod +x /root/supabase-backup.sh
echo "✅ Backup script created"
echo ""

# Setup cron job
echo "⏰ Step 4: Setting up cron job (daily at 2 PM)..."
(crontab -l 2>/dev/null | grep -v supabase-backup.sh; echo "0 14 * * * /root/supabase-backup.sh >> /var/log/supabase-backup.log 2>&1") | crontab -
echo "✅ Cron job added"
echo ""

# Test backup
echo "🧪 Step 5: Testing backup..."
/root/supabase-backup.sh
echo ""

# Show results
echo "📊 Backup Status:"
echo "================"
ls -lh /root/supabase-backups/ | tail -5
echo ""

echo "✅ Setup Complete!"
echo ""
echo "📝 Summary:"
echo "  - Backup script: /root/supabase-backup.sh"
echo "  - Backup location: /root/supabase-backups/"
echo "  - Schedule: Daily at 2 PM"
echo "  - Retention: 30 days"
echo "  - Log file: /var/log/supabase-backup.log"
echo ""
echo "🔍 Useful commands:"
echo "  - Manual backup: /root/supabase-backup.sh"
echo "  - List backups: ls -lh /root/supabase-backups/"
echo "  - View logs: tail -f /var/log/supabase-backup.log"
echo "  - Check cron: crontab -l"
echo ""
