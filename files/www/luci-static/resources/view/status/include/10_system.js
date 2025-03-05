'use strict';
'require baseclass';
'require fs';
'require rpc';

var callSystemBoard = rpc.declare({
    object: 'system',
    method: 'board'
});

var callSystemInfo = rpc.declare({
    object: 'system',
    method: 'info'
});

return baseclass.extend({
    title: _('System'),

    load: function () {
        return Promise.all([
            L.resolveDefault(callSystemBoard(), {}),
            L.resolveDefault(callSystemInfo(), {}),
            fs.lines('/usr/lib/lua/luci/version.lua'),
fs.exec('/bin/sh', ['-c', "/usr/bin/top -bn1 | /usr/bin/awk '/CPU:/ {print 100 - $8;exit}'"])
    .then(res => res.stdout.trim())  // Берём результат и убираем лишние пробелы/переносы
    .catch(() => '?'),  // В случае ошибки вернуть "?"
            fs.lines('/tmp/blocked_ips.txt'),
            fs.lines('/tmp/unblocked_ips.txt')
        ]);
    },

    render: function (data) {
        var boardinfo = data[0];
        var systeminfo = data[1];
        var luciversion = data[2];
        var cpuLoad = data[3] + '%';
        var blockedIps = data[4];
        var unblockedIps = data[5];

        luciversion = luciversion
            .filter(function (l) {
                return l.match(/^\s*(luciname|luciversion)\s*=/);
            })
            .map(function (l) {
                return l.replace(/^\s*\w+\s*=\s*['"]([^'"]+)['"].*$/, '$1');
            })
            .join(' ');

        var datestr = null;
        if (systeminfo.localtime) {
            var date = new Date(systeminfo.localtime * 1000);
            datestr = '%04d-%02d-%02d %02d:%02d:%02d'.format(
                date.getUTCFullYear(),
                date.getUTCMonth() + 1,
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds()
            );
        }
        
        var blockedIpsText = blockedIps.length > 0 ? blockedIps.join('\n,\n') : _('Нет заблоченных IP');
        var unblockedIpsText = unblockedIps.length > 0 
            ? 'Подсетей загружено: ' + '\n' + unblockedIps
            : _('Подсети для разблокировки не загружены ! ! !');

        var fields = [
            _('Hostname'), boardinfo.hostname,
            _('Model'), boardinfo.model,
            _('Architecture'), boardinfo.system,
            _('Firmware Version'),
            (L.isObject(boardinfo.release) ? boardinfo.release.description + ' / ' : '') + (luciversion || ''),
            _('Kernel Version'), boardinfo.kernel,
            _('Local Time'), datestr,
            _('Uptime'), systeminfo.uptime ? '%t'.format(systeminfo.uptime) : null,
            _('Заблоченные IP :'), blockedIpsText,
            _('Обход блокировки RuNet :'), unblockedIpsText,
			_('Загрузка CPU'), cpuLoad,
            _('Load Average'),
            Array.isArray(systeminfo.load)
                ? '%.2f, %.2f, %.2f'.format(
                      systeminfo.load[0] / 65535.0,
                      systeminfo.load[1] / 65535.0,
                      systeminfo.load[2] / 65535.0
                  )
                : null,
        ];

        var table = E('div', { class: 'table' });
        for (var i = 0; i < fields.length; i += 2) {
            table.appendChild(
                E('div', { class: 'tr' }, [
                    E('div', { class: 'td left', width: '33%' }, [fields[i]]),
                    E('div', { class: 'td left' }, [fields[i + 1] != null ? fields[i + 1] : '?'])
                ])
            );
        }

        return table;
    }
});
