#!/bin/sh

# Проверка назначенного IP интерфейса eth1
ifconfig eth1 | grep 'inet addr' | cut -d: -f2 | grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' > /tmp/ip-eth1_now.txt
diff /tmp/ip-eth1.txt /tmp/ip-eth1_now.txt

if [ $? -eq 0 ]; then
    echo "IP актуален"
else
    logger -s "*  *  * Запуск проверки IP ... IP не актуален, запускаем DDNS *  *  *"
    /usr/lib/ddns/dynamic_dns_updater.sh -- start
    sleep 20
    /usr/lib/ddns/dynamic_dns_updater.sh -- stop
    ifconfig eth1 | grep 'inet addr' | cut -d: -f2 | grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' > /tmp/ip-eth1.txt
fi

# Проверка IP домена
nslookup romasik.ddns.net | tail -n2 | grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' > /tmp/registered_domain_IP.txt
diff /tmp/registered_domain_IP.txt /tmp/ip-eth1_now.txt

if [ $? -eq 0 ]; then
    echo "IP актуален"
else
	logger -s "*  *  * Запуск проверки IP ... IP ДОМЕНА не актуален, запускаем DDNS *  *  *"
    /usr/lib/ddns/dynamic_dns_updater.sh -- start
    sleep 20
    /usr/lib/ddns/dynamic_dns_updater.sh -- stop
fi
