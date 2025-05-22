"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const notifier_1 = require("../utils/notifier");
const router = (0, express_1.Router)();
const TABLE = 'tickets';
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;
function load() { return (0, dataStore_1.read)(TABLE); }
function save(list) { (0, dataStore_1.write)(TABLE, list); }
router.get('/', (_req, res) => {
    res.json(load());
});
router.post('/', (req, res) => {
    const { username, target, title, message } = req.body;
    if (!username || !target || !title || !message)
        return res.status(400).json({ error: 'Données manquantes' });
    const users = (0, dataStore_1.read)('users');
    const author = users.find(u => u.username === username);
    const ticket = {
        id: Date.now().toString(),
        username,
        managerId: author?.managerId,
        target: target,
        title,
        message,
        status: 'open',
        date: new Date().toISOString(),
    };
    const list = load();
    list.push(ticket);
    save(list);
    const admins = users
        .filter(u => u.role === 'admin' && mailRx.test(u.username))
        .map(u => u.username);
    const managerMail = ticket.managerId
        ? users.find(u => u.id === ticket.managerId)?.username
        : undefined;
    const to = [];
    if (ticket.target === 'admin' || ticket.target === 'both')
        to.push(...admins);
    if ((ticket.target === 'manager' || ticket.target === 'both') && managerMail && mailRx.test(managerMail))
        to.push(managerMail);
    (0, notifier_1.notify)({
        username,
        category: 'ticket',
        message: `Nouveau ticket: ${title}`,
        to,
    }).catch(err => console.error('[TICKET]', err.message));
    res.status(201).json(ticket);
});
router.patch('/:id', (req, res) => {
    const { status } = req.body;
    if (!status)
        return res.status(400).json({ error: 'Statut manquant' });
    const list = load();
    const idx = list.findIndex(t => t.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Introuvable' });
    list[idx].status = status;
    save(list);
    const ticket = list[idx];
    const to = mailRx.test(ticket.username) ? [ticket.username] : [];
    (0, notifier_1.notify)({
        username: ticket.username,
        category: 'ticket',
        message: `Mise à jour du ticket "${ticket.title}" : ${status}`,
        to,
    }).catch(err => console.error('[TICKET]', err.message));
    res.json(ticket);
});
exports.default = router;
