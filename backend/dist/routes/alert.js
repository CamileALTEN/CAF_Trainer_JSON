"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const CONF = 'alertConfig';
const ACTS = 'alertActions';
function loadConf() {
    return (0, dataStore_1.read)(CONF)[0] ?? {
        text: 'Mise à jour nécessaire du contenu des modules',
        url: '#',
        frequency: 0,
        active: false,
    };
}
function saveConf(c) {
    (0, dataStore_1.write)(CONF, [c]);
}
function loadActs() {
    return (0, dataStore_1.read)(ACTS);
}
function saveActs(list) {
    (0, dataStore_1.write)(ACTS, list);
}
router.get('/', (_req, res) => {
    res.json(loadConf());
});
router.put('/', (req, res) => {
    const conf = loadConf();
    const { text, url, frequency, active } = req.body;
    if (text !== undefined)
        conf.text = text;
    if (url !== undefined)
        conf.url = url;
    if (typeof frequency === 'number')
        conf.frequency = frequency;
    if (typeof active === 'boolean')
        conf.active = active;
    saveConf(conf);
    res.json(conf);
});
router.get('/actions', (_req, res) => {
    res.json(loadActs());
});
function parseName(u) {
    const m = u.match(/^(\w+)\.(\w+)@/);
    if (m)
        return `${m[1]} ${m[2]}`;
    return u;
}
router.post('/actions', (req, res) => {
    const list = loadActs();
    const { items, user, comment } = req.body;
    const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: items || [],
        user: parseName(user || ''),
        comment: comment ?? ''
    };
    list.push(entry);
    saveActs(list);
    const conf = loadConf();
    conf.active = false;
    conf.lastAck = entry.date;
    saveConf(conf);
    res.status(201).json(entry);
});
router.delete('/actions', (_req, res) => {
    saveActs([]);
    res.status(204).end();
});
exports.default = router;
