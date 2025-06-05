"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const analytics_1 = require("../utils/analytics");
const router = (0, express_1.Router)();
const TABLE = 'favorites';
router.get('/:userId', (req, res) => {
    const list = (0, dataStore_1.read)(TABLE);
    const row = list.find(f => f.userId === req.params.userId);
    res.json(row ? row.items : []);
});
router.post('/', async (req, res) => {
    const { userId, itemId } = req.body;
    if (!userId || !itemId)
        return res.status(400).json({ error: 'Missing data' });
    const list = (0, dataStore_1.read)(TABLE);
    let row = list.find(f => f.userId === userId);
    if (!row) {
        row = { userId, items: [itemId] };
        list.push(row);
    }
    else if (!row.items.includes(itemId)) {
        row.items.push(itemId);
    }
    (0, dataStore_1.write)(TABLE, list);
    try {
        await (0, analytics_1.recordFavorite)(userId, itemId);
    }
    catch { /* ignore */ }
    res.json({ ok: true });
});
router.delete('/', (req, res) => {
    const { userId, itemId } = req.body;
    if (!userId || !itemId)
        return res.status(400).json({ error: 'Missing data' });
    const list = (0, dataStore_1.read)(TABLE);
    const row = list.find(f => f.userId === userId);
    if (row) {
        row.items = row.items.filter(id => id !== itemId);
        (0, dataStore_1.write)(TABLE, list);
    }
    res.json({ ok: true });
});
exports.default = router;
