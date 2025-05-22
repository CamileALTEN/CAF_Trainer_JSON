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
    const { username, role, managerId } = req.query;
    let list = load();
    if (role === 'caf' && username) {
        list = list.filter(t => t.username === username);
    }
    else if (role === 'manager') {
        list = list.filter(t => t.username === username || t.managerId === managerId);
    }
    res.json(list);
});
router.post('/', (req, res) => {
    const { username, target, title, message, category, priority, attachment } = req.body;
    if (!username || !target || !title || !message)
        return res.status(400).json({ error: 'Données manquantes' });
    const users = (0, dataStore_1.read)('users');
    const author = users.find(u => u.username === username);
    const ticket = {
        id: Date.now().toString(),
        username,
        managerId: author?.managerId,
        target: target,
        assignedToId: undefined,
        assignments: [],
        category,
        priority: priority || 'normal',
        attachment,
        title,
        message,
        status: 'open',
        date: new Date().toISOString(),
        replies: [],
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
router.patch('/:id', (req, res) => {
    const { status, assignedToId, author, role } = req.body;
    const list = load();
    const ticket = list.find(t => t.id === req.params.id);
    if (!ticket)
        return res.status(404).json({ error: 'Introuvable' });
    const users = (0, dataStore_1.read)('users');
    if (assignedToId) {
        if (ticket.assignedToId && ticket.assignedToId !== assignedToId && role !== 'admin') {
            return res.status(403).json({ error: 'Réassignation réservée aux admins' });
        }
        ticket.assignedToId = assignedToId;
        ticket.assignments = ticket.assignments || [];
        ticket.assignments.push({ assigneeId: assignedToId, date: new Date().toISOString() });
        const assignee = users.find(u => u.id === assignedToId)?.username;
        const to = assignee && mailRx.test(assignee) ? [assignee] : [];
        (0, notifier_1.notify)({
            username: author || 'system',
            category: 'ticket',
            message: `Ticket "${ticket.title}" assigné à ${assignee}`,
            to,
        }).catch(err => console.error('[TICKET]', err.message));
    }
    if (status) {
        ticket.status = status;
        const to = mailRx.test(ticket.username) ? [ticket.username] : [];
        if (status === 'resolved' || status === 'closed') {
            (0, notifier_1.notify)({
                username: ticket.username,
                category: 'ticket',
                message: `Ticket "${ticket.title}" ${status === 'resolved' ? 'résolu' : 'fermé'}`,
                to,
            }).catch(err => console.error('[TICKET]', err.message));
        }
        else {
            (0, notifier_1.notify)({
                username: ticket.username,
                category: 'ticket',
                message: `Mise à jour du ticket "${ticket.title}" : ${status}`,
                to,
            }).catch(err => console.error('[TICKET]', err.message));
        }
    }
    save(list);
    res.json(ticket);
});
exports.default = router;
