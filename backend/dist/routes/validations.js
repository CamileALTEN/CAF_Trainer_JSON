"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const PROGRESS = 'userProgress';
const LOGS = 'validationLogs';
router.get('/pending', (_req, res) => {
    const list = (0, dataStore_1.read)(PROGRESS);
    res.json(list.filter(p => p.status === 'en_attente'));
});
router.get('/completed', (_req, res) => {
    const list = (0, dataStore_1.read)(PROGRESS);
    res.json(list.filter(p => p.status === 'terminé' || p.status === 'validé'));
});
router.post('/:userId/:itemId', (req, res) => {
    const { userId, itemId } = req.params;
    const { action, targetStatus, comment, managerId } = req.body;
    const list = (0, dataStore_1.read)(PROGRESS);
    const idx = list.findIndex(p => p.userId === userId && p.itemId === itemId);
    if (idx === -1)
        return res.status(404).json({ error: 'Introuvable' });
    const oldStatus = list[idx].status;
    let newStatus = oldStatus;
    if (action === 'approve')
        newStatus = 'validé';
    else if (action === 'reject')
        newStatus = 'en_cours';
    else if (action === 'rollback') {
        if (!targetStatus || (targetStatus !== 'en_cours' && targetStatus !== 'non_commencé')) {
            return res.status(400).json({ error: 'targetStatus requis' });
        }
        newStatus = targetStatus;
    }
    else {
        return res.status(400).json({ error: 'action inconnue' });
    }
    list[idx].status = newStatus;
    (0, dataStore_1.write)(PROGRESS, list);
    const logs = (0, dataStore_1.read)(LOGS);
    logs.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        managerId: managerId ?? 'unknown',
        userId,
        itemId,
        oldStatus,
        newStatus,
        comment,
    });
    (0, dataStore_1.write)(LOGS, logs);
    res.json(list[idx]);
});
exports.default = router;
