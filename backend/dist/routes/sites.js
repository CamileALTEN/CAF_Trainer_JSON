"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const TABLE = 'sites';
function load() { return (0, dataStore_1.read)(TABLE); }
function save(list) { (0, dataStore_1.write)(TABLE, list); }
function findIndex(id, list = load()) { return list.findIndex(s => s.id === id); }
router.get('/', (_req, res) => res.json(load()));
router.post('/', (req, res) => {
    const { name, color } = req.body;
    if (!name || !color)
        return res.status(400).json({ error: 'name et color requis' });
    const list = load();
    const site = { id: Date.now().toString(), name, color };
    list.push(site);
    save(list);
    res.status(201).json(site);
});
router.patch('/:id', (req, res) => {
    const list = load();
    const idx = findIndex(req.params.id, list);
    if (idx === -1)
        return res.status(404).json({ error: 'Introuvable' });
    Object.assign(list[idx], req.body);
    save(list);
    res.json(list[idx]);
});
router.delete('/:id', (req, res) => {
    const list = load();
    const idx = findIndex(req.params.id, list);
    if (idx === -1)
        return res.status(404).json({ error: 'Introuvable' });
    list.splice(idx, 1);
    save(list);
    res.status(204).end();
});
exports.default = router;
