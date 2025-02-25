#!/bin/sh

BLOCK_LIST_FILE="/tmp/blocked_ips.txt"
MAX_ATTEMPTS=3  # Максимальное количество попыток до блокировки

# Функция для блокировки IP
block_ip() {
    IP=$1
    iptables -I INPUT -s $IP -j DROP -m comment --comment "Заблокирован, пытался подключиться"
    echo "$IP" >> "$BLOCK_LIST_FILE"
	logger -s "! ! ! Заблочили какого-то мудака с IP: $ip ! ! !"
}

# Основной цикл отслеживания логов с использованием logread
while true; do
    # Используем logread для получения новых записей
    logread | tail -n 20 | grep "failed login" | awk '{print $NF}' | sort | uniq -c | while read count ip; do
        # Если количество попыток больше или равно MAX_ATTEMPTS, блокируем IP
        if [ "$count" -ge "$MAX_ATTEMPTS" ]; then
            # Блокировка IP, если его еще нет в списке
            if ! grep -q "$ip" "$BLOCK_LIST_FILE"; then
                block_ip "$ip"
            fi
        fi
    done
    # Задержка, чтобы не создавать чрезмерную нагрузку
    #sleep 30
	break #добавил чтобы отключить цикл
done
