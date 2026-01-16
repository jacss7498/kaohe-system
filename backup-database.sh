#!/bin/bash

BACKUP_DIR="/volume1/docker/kaohe4/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="kaohe-backend"
DB_PATH="/app/data/kaohe.db"

mkdir -p "$BACKUP_DIR"

echo "=== 开始备份数据库 ==="
echo "时间: $(date)"

echo 'Sun123456789' | sudo -S docker cp ${DB_CONTAINER}:${DB_PATH} "${BACKUP_DIR}/kaohe_${DATE}.db"

if [ $? -eq 0 ]; then
    echo "✓ 数据库文件复制成功"
    echo 'Sun123456789' | sudo -S chown szy:admin "${BACKUP_DIR}/kaohe_${DATE}.db"
    gzip "${BACKUP_DIR}/kaohe_${DATE}.db"
    
    if [ $? -eq 0 ]; then
        echo "✓ 备份文件压缩成功: kaohe_${DATE}.db.gz"
        SIZE=$(du -h "${BACKUP_DIR}/kaohe_${DATE}.db.gz" | cut -f1)
        echo "  备份大小: ${SIZE}"
    fi
    
    find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
    echo "✓ 已清理30天前的旧备份"
    
    echo ""
    echo "当前备份文件列表:"
    ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -5
else
    echo "✗ 备份失败"
    exit 1
fi

echo "=== 备份完成 ==="
