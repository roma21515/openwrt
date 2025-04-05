#!/bin/sh

MAX_RETRIES=7
SLEEP_INTERVAL=5

# Начальная попытка
attempt=1

while [ $attempt -le $MAX_RETRIES ]; do
    if ping -I wg0 -c 2 -s 256 1.1.1.1 > /dev/null 2>&1; then
        exit 0
    else
        if [ $attempt -eq 1 ]; then
            logger -s "*  *  * WireGuard не работает, перезапускаю *  *  *"
        else
            logger -s "*  *  * WireGuard не работает, повторный перезапуск $attempt *  *  *"
        fi
        ifup wg0
		sleep 1
		ping -I wg0 -c 2 -s 256 1.1.1.1
        sleep $SLEEP_INTERVAL
    fi
    attempt=$((attempt + 1))
done

# Если после всех попыток не удалось восстановить соединение, сообщаем об этом
logger -s "*  *  * WireGuard не удалось восстановить соединение после $MAX_RETRIES попыток пробуем перезапуск сети *  *  *"
/etc/init.d/network restart
exit 1
