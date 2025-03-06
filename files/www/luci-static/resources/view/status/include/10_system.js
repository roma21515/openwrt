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
                .then(res => res.stdout.trim())  
                .catch(() => '?'),
            fs.lines('/tmp/blocked_ips.txt'),
            fs.lines('/tmp/unblocked_ips.txt')
        ]);
    },

    render: function (data) {
        var boardinfo = data[0];
        var systeminfo = data[1];
        var luciversion = data[2];
        var cpuLoad = parseFloat(data[3]);
        var blockedIps = data[4];
        var unblockedIps = data[5];

        luciversion = luciversion
            .filter(l => l.match(/^\s*(luciname|luciversion)\s*=/))
            .map(l => l.replace(/^\s*\w+\s*=\s*['"]([^'"]+)['"].*$/, '$1'))
            .join(' ');

        var datestr = systeminfo.localtime ? new Date(systeminfo.localtime * 1000).toISOString().replace('T', ' ').split('.')[0] : null;

        var blockedIpsText = blockedIps.length > 0 ? blockedIps.join('\n,\n') : _('Нет заблоченных IP');
        var unblockedIpsText = unblockedIps.length > 0
            ? 'Подсетей загружено: ' + '\n' + unblockedIps
            : _('Подсети для разблокировки не загружены ! ! !');

        // Новый прогресс-бар CPU
        var cpuProgressBar = E('div', {
            style: `width: 100%; height: 20px; background: #eeeeee; position: relative; overflow: hidden;
			border: 1px solid #999999;`  // Окантовка серого цвета`
        }, [
            // Градиент, но скрытая часть остаётся серой
            E('div', {
                style: `width: 100%; height: 100%; position: absolute; left: 0; top: 0;
                        background: linear-gradient(to right, #5bc0de 0%, #00ff00 35%, #ffff00 70%, #ff0000 100%);
                        clip-path: inset(0 ${100 - cpuLoad}% 0 0);`
            }),
            // Текст в центре
            E('div', {
                style: `width: 100%; height: 100%; position: absolute; top: 0; left: 0; 
				display: flex; justify-content: center; align-items: center; font-size: 0.75rem;
                        line-height: 25px; color: black; text-shadow: 1px 1px 1px gray;`
            }, `${cpuLoad}%`)
        ]);

        var fields = [
            _('Hostname'), boardinfo.hostname,
            _('Model'), boardinfo.model,
            _('Architecture'), boardinfo.system,
            _('Firmware Version'), (L.isObject(boardinfo.release) ? boardinfo.release.description + ' / ' : '') + (luciversion || ''),
            _('Kernel Version'), boardinfo.kernel,
            _('Local Time'), datestr,
            _('Uptime'), systeminfo.uptime ? '%t'.format(systeminfo.uptime) : null,
            _('Заблоченные IP :'), blockedIpsText,
            _('Обход блокировки RuNet :'), unblockedIpsText,
            _('Загрузка CPU'), cpuProgressBar,
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
