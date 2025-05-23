"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const TABLE = 'userProgress';
router.patch('/:userId/items/:itemId/status', (req, res) => {
    const { status } = req.body;
    const { userId, itemId } = req.params;
    if (!status)
        return res.status(400).json({ error: 'status manquant' });
    const list = (0, dataStore_1.read)(TABLE);
    const idx = list.findIndex(p => p.userId === userId && p.itemId === itemId);
    if (idx === -1)
        list.push({ userId, itemId, status });
    else
        list[idx].status = status;
    (0, dataStore_1.write)(TABLE, list);
    res.json({ ok: true });
});
exports.default = router;
