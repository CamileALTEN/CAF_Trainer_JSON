"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const mailer_1 = require("../utils/mailer");
const router = (0, express_1.Router)();
const NOTIFS = 'notifications';
/**
  * GET /api/notifications
  */
router.get('/', (req, res) => {
    const { managerId } = req.query;
    const notifs = (0, dataStore_1.read)(NOTIFS);
    if (managerId) {
        const users = (0, dataStore_1.read)('users');
        const cafs = users.filter(u => u.managerId === managerId).map(u => u.username);
        return res.json(notifs.filter(n => cafs.includes(n.username)));
    }
    res.json(notifs);
});
/**
* POST /api/notifications
* Body: { username, date, message? }
*/
router.post('/', async (req, res) => {
    const notifs = (0, dataStore_1.read)(NOTIFS);
    const entry = {
        id: Date.now().toString(),
        ...req.body,
    };
    notifs.push(entry);
    (0, dataStore_1.write)(NOTIFS, notifs);
    // tentative d'envoi de mail au manager référent
    try {
        const users = (0, dataStore_1.read)('users');
        const caf = users.find(u => u.username === entry.username);
        const manager = caf && caf.managerId
            ? users.find(u => u.id === caf.managerId)
            : undefined;
        const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;
        if (manager && mailRx.test(manager.username)) {
            await (0, mailer_1.sendMail)(manager.username, 'CAF‑Trainer : nouvelle notification', `<p>${entry.username} : ${entry.message ?? ''}</p>`);
        }
    }
    catch (err) {
        console.error('[NOTIF]', err.message);
    }
    res.status(201).json(entry);
});
exports.default = router;
