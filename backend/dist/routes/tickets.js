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
router.get('/', (req, res) => {
    const q = req.query.search?.toLowerCase();
    const list = load().filter(t => !t.archived);
    if (q) {
        return res.json(list.filter(t => t.title.toLowerCase().includes(q) ||
            t.message.toLowerCase().includes(q) ||
            t.replies.some(r => r.message.toLowerCase().includes(q))));
    }
    res.json(list);
});
router.post('/', (req, res) => {
    const { username, target, title, message, category, priority } = req.body;
    if (!username || !target || !title || !message)
        return res.status(400).json({ error: 'Données manquantes' });
    const users = (0, dataStore_1.read)('users');
    const author = users.find(u => u.username === username);
    const ticket = {
        id: Date.now().toString(),
        username,
        managerId: author?.managerIds?.[0],
        target: target,
        category,
        priority: priority || 'normal',
        title,
        message,
        status: 'open',
        date: new Date().toISOString(),
        replies: [],
        archived: false,
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
        message: `Nouveau ticket de ${username} intitulé "${title}" :       ${message}.`,
        to,
    }).catch(err => console.error('[TICKET]', err.message));
    res.status(201).json(ticket);
});
router.post('/:id/reply', (req, res) => {
    const { author, role, message } = req.body;
    if (!author || !role || !message)
        return res.status(400).json({ error: 'Données manquantes' });
    const list = load();
    const ticket = list.find(t => t.id === req.params.id);
    if (!ticket)
        return res.status(404).json({ error: 'Introuvable' });
    const reply = { author, role, message, date: new Date().toISOString() };
    ticket.replies.push(reply);
    save(list);
    const to = mailRx.test(ticket.username) ? [ticket.username] : [];
    (0, notifier_1.notify)({
        username: author,
        category: 'ticket',
        message: `Nouvelle réponse au ticket "${ticket.title}"`,
        to,
    }).catch(err => console.error('[TICKET]', err.message));
    res.status(201).json(reply);
});
router.get('/:id/export', (req, res) => {
    const ticket = load().find(t => t.id === req.params.id);
    if (!ticket)
        return res.status(404).json({ error: 'Introuvable' });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.id}.json`);
    res.send(JSON.stringify(ticket, null, 2));
});
router.patch('/:id', (req, res) => {
    const { status, archived, title, message, category, priority, } = req.body;
    if (status === undefined &&
        archived === undefined &&
        title === undefined &&
        message === undefined &&
        category === undefined &&
        priority === undefined)
        return res.status(400).json({ error: 'Données manquantes' });
    const list = load();
    const idx = list.findIndex(t => t.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Introuvable' });
    if (status !== undefined)
        list[idx].status = status;
    if (archived !== undefined)
        list[idx].archived = archived;
    if (title !== undefined)
        list[idx].title = title;
    if (message !== undefined)
        list[idx].message = message;
    if (category !== undefined)
        list[idx].category = category;
    if (priority !== undefined)
        list[idx].priority = priority;
    save(list);
    const ticket = list[idx];
    const to = mailRx.test(ticket.username) ? [ticket.username] : [];
    (0, notifier_1.notify)({
        username: ticket.username,
        category: 'ticket',
        message: `Mise à jour du ticket "${ticket.title}"`,
        to,
    }).catch(err => console.error('[TICKET]', err.message));
    res.json(ticket);
});
exports.default = router;
