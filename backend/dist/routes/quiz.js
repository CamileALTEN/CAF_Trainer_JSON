"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const TABLE = 'quizResults';
router.get('/:username', (req, res) => {
    const rows = (0, dataStore_1.read)(TABLE).filter(r => r.username === req.params.username);
    res.json(rows);
});
router.post('/', (req, res) => {
    const { username, moduleId, itemId, answers, score } = req.body;
    if (!username || !moduleId || !itemId || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Données manquantes' });
    }
    const list = (0, dataStore_1.read)(TABLE);
    const date = new Date().toISOString();
    const rec = { username, moduleId, itemId, answers, score: score ?? 0, date };
    const idx = list.findIndex(r => r.username === username && r.moduleId === moduleId && r.itemId === itemId);
    if (idx === -1)
        list.push(rec);
    else
        list[idx] = rec;
    (0, dataStore_1.write)(TABLE, list);
    res.json({ ok: true });
});
exports.default = router;
