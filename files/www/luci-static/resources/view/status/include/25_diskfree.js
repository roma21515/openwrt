'use strict';
'require baseclass';
'require fs';

function parseDfOutput(output) {
    var lines = output.trim().split('\n');
    var result = {};

    lines.slice(1).forEach(line => {
        var parts = line.split(/\s+/);
        if (parts.length >= 6) {
            var mountpoint = parts[5]; // Точка монтирования
            result[mountpoint] = {
                size: parts[1],
                used: parts[2],
                available: parts[3],
                percent: parseInt(parts[4]) // Убираем %
            };
        }
    });

    return result;
}

function progressbar(value, max, used, size) {
    var pc = Math.min(Math.max(value, 0), 100); // Ограничиваем от 0 до 100

    // Создаем контейнер с прогрессбаром и текстом внутри
    return E('div', {
        'class': 'cbi-progressbar',
        'title': `${used} / ${size} (${pc}%)`
    }, [
        E('div', { 'style': `width:${pc}%;` }), // Прогресс-бар
    ]);
}

return baseclass.extend({
    title: _('Флеш память'),

    load: function() {
        return fs.exec('/bin/sh', ['-c', '/bin/df -h']).then(res => {
            return parseDfOutput(res.stdout);
        });
    },

    render: function(data) {
        var overlay = data['/overlay'] || { size: '?', used: '?', available: '?', percent: 0 };
        var tmpfs = data['/tmp'] || { size: '?', used: '?', available: '?', percent: 0 };

        var table = E('div', { 'class': 'table' });

        function addRow(title, info) {
            table.appendChild(E('tr', { 'class': 'tr' }, [
                E('div', { 'class': 'td left', 'width': '33%' }, title),
                E('div', { 'class': 'td left' }, progressbar(info.percent, 100, info.used, info.size))
            ]));
        }

        addRow(_('Флеш накопитель'), overlay);
        addRow(_('TempFS'), tmpfs);

        return table;
    }
});
