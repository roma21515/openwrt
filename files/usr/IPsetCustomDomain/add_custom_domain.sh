#!/bin/sh

CONFIG_FILE="/tmp/dnsmasq.d/custom_domains"

names=$(grep "list name" /etc/config/dhcp | awk -F "'" '{print $2}')
domains=$(grep "list domain" /etc/config/dhcp | awk -F "'" '{print $2}')

for name in $names; do
    for domain in $domains; do
        echo "ipset=/$domain/$name" >> "$CONFIG_FILE"
    done
done

logger -t CustomDomainIPset "= = = Свои домены добавлены в IPSET = = ="