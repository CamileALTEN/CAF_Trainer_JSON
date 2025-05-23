"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const mailer_1 = require("../utils/mailer");
const router = (0, express_1.Router)();
const TABLE = 'userProgress';
const HELP_TABLE = 'helpRequests';
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;
router.get('/', (req, res) => {
    const { managerId } = req.query;
    const list = (0, dataStore_1.read)(TABLE);
    if (managerId) {
        const users = (0, dataStore_1.read)('users');
        const cafIds = users.filter(u => u.managerId === managerId).map(u => u.id);
        return res.json(list.filter(p => cafIds.includes(p.userId)));
    }
    res.json(list);
});
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    const list = (0, dataStore_1.read)(TABLE).filter(p => p.userId === userId);
    res.json(list);
});
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
router.post('/:userId/items/:itemId/help-request', (req, res) => {
    const { message, email } = req.body;
    const { userId, itemId } = req.params;
    if (!message)
        return res.status(400).json({ error: 'message manquant' });
    let to = email;
    if (!to) {
        const users = (0, dataStore_1.read)('users');
        const user = users.find(u => u.id === userId);
        const managerMail = user?.managerId ? users.find(u => u.id === user.managerId)?.username : undefined;
        if (managerMail && mailRx.test(managerMail))
            to = managerMail;
    }
    const list = (0, dataStore_1.read)(HELP_TABLE);
    const entry = {
        id: Date.now().toString(),
        userId,
        itemId,
        message,
        email: to,
        date: new Date().toISOString(),
    };
    list.push(entry);
    (0, dataStore_1.write)(HELP_TABLE, list);
    if (to && process.env.MAIL_USER && process.env.MAIL_PASS) {
        (0, mailer_1.sendMail)(to, 'CAF‑Trainer Aide', `<p>${message}</p>`).catch(err => console.error('[HELP]', err.message));
    }
    res.status(201).json(entry);
});
exports.default = router;
