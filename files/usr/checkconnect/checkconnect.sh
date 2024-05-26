#!/bin/sh
echo --------------- --------------- --------------- --
echo WAN CONTROLL RESTART
echo --------------- --------------- --------------- --
PINGRESORCE1="8.8.8.8"
PINGRESORCE2="1.1.1.1"
# then error or not ping (> /dev/null 2>&1)
if (! ping -q -c3 ${PINGRESORCE1} > /dev/null 2>&1)
then
if (! ping -q -c3 ${PINGRESORCE2} > /dev/null 2>&1)
then
   reboot
else
echo 'internet ok'
fi
else
echo 'internet ok'
fi