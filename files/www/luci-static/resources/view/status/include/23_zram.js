'use strict';
'require baseclass';
'require fs';

function parseZramStatus(output) {
    let data = {
        device_size: 0,
        memory_used: 0,
        original_size: 0,
        max_memory_used: 0,
        compression_ratio: 1
    };

    let lines = output.trim().split('\n');
    lines.forEach(line => {
        let parts = line.split('-').map(s => s.trim());
        if (parts.length < 2) return;

        let key = parts[0].toLowerCase().replace(/ /g, '_');
        let value = parseFloat(parts[1]);

        if (key.includes('device_size')) data.device_size = value;
        if (key.includes('memory_used')) data.memory_used = value;
        if (key.includes('original_data_size')) data.original_size = value;
        if (key.includes('maximum_memory_ever_used')) data.max_memory_used = value;
    });

    if (data.memory_used > 0 ) {
        data.compression_ratio = data.original_size / (data.memory_used);
    }

    return data;
}

function progressbar(value, max, label) {
    let percent = max ? Math.round((value / max) * 100) : 0;
    return E('div', { 'class': 'cbi-progressbar', 'title': `${value} MB / ${max} MB (${percent}%)` }, [
        E('div', { 'style': `width:${percent}%;` })
    ]);
}

return baseclass.extend({
    title: _('Статус Zram'),

    load: function() {
        return fs.exec('/etc/init.d/zram', ['status']).then(res => {
            return parseZramStatus(res.stdout);
        }).catch(() => {
            return null;
        });
    },

	render: function(data) {
        var table = E('div', { 'class': 'table' });

        function addRow(title, value, max) {
            table.appendChild(E('div', { 'class': 'tr' }, [
                E('div', { 'class': 'td left', 'width': '33%' }, title),
                E('div', { 'class': 'td left' }, progressbar(value, max, title))
            ]));
        }

        addRow(_('Использовано Zram'), data.original_size, data.device_size);
		addRow(_('Сжатые данные с оверхедом'), data.memory_used, data.device_size/4);

        table.appendChild(E('div', { 'class': 'tr' }, [
            E('div', { 'class': 'td left', 'width': '33%' }, _('Пик сжатой памяти за все время')),
            E('div', { 'class': 'td left' }, `${data.max_memory_used.toFixed(2)} MB`)
        ]));

        table.appendChild(E('div', { 'class': 'tr' }, [
            E('div', { 'class': 'td left', 'width': '33%' }, _('Степень сжатия')),
            E('div', { 'class': 'td left' }, `${data.compression_ratio.toFixed(2)}x`)
        ]));

        return table;
    }
});
