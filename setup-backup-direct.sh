#!/bin/bash

echo "🔄 Supabase Backup Setup - Ashwheel"
echo "===================================="

# Get Postgres password
echo "🔍 Detecting Postgres password..."
DB_PASS=$(docker exec $(docker ps | grep supabase-db | awk '{print $1}') env | grep POSTGRES_PASSWORD | cut -d'=' -f2)

if [ -z "$DB_PASS" ]; then
    echo "❌ Could not detect Postgres password"
    echo "Please enter manually:"
    read -s DB_PASS
fi

echo "✅ Password detected"

# Create backup directory
echo "📁 Creating backup directory..."
mkdir -p /root/supabase-backups

# Create backup script
echo "📝 Creating backup script..."
cat > /root/supabase-backup.sh << 'SCRIPT_END'
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/supabase-backups"
DB_CONTAINER=$(docker ps | grep supabase-db | awk '{print $1}')
DB_USER="postgres"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "========================================" | tee -a /var/log/supabase-backup.log
echo "Backup started: $(date)" | tee -a /var/log/supabase-backup.log

docker exec $DB_CONTAINER pg_dumpall -U $DB_USER > $BACKUP_DIR/backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "✅ Database backup successful" | tee -a /var/log/supabase-backup.log
    gzip $BACKUP_DIR/backup_$DATE.sql
    BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.sql.gz | cut -f1)
    echo "Backup size: $BACKUP_SIZE" | tee -a /var/log/supabase-backup.log
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
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

# Setup cron job
echo "⏰ Setting up cron job (Daily 2 PM)..."
(crontab -l 2>/dev/null | grep -v supabase-backup.sh; echo "0 14 * * * /root/supabase-backup.sh >> /var/log/supabase-backup.log 2>&1") | crontab -

# Test backup
echo "🧪 Running test backup..."
/root/supabase-backup.sh

# Show results
echo ""
echo "✅ Setup Complete!"
echo "===================="
echo "📁 Backup location: /root/supabase-backups/"
echo "⏰ Schedule: Daily at 2 PM"
echo "📝 Logs: /var/log/supabase-backup.log"
echo ""
echo "📊 Current backups:"
ls -lh /root/supabase-backups/
echo ""
echo "🎯 Quick commands:"
echo "  - Manual backup: /root/supabase-backup.sh"
echo "  - View logs: tail -f /var/log/supabase-backup.log"
echo "  - List backups: ls -lh /root/supabase-backups/"
