"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const TABLE = 'users';
const hash = (pwd) => bcrypt_1.default.hashSync(pwd, 8);
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;
/* ───────────── GET liste complète ───────────── */
router.get('/', (_req, res) => {
    const { managerId } = _req.query;
    let list = (0, dataStore_1.read)(TABLE);
    if (managerId)
        list = list.filter(u => u.managerIds?.includes(managerId));
    res.json(list.map(({ password, ...u }) => u));
});
/* ───────────── POST création ─────────────────── */
router.post('/', (req, res) => {
    const { username, password, role, site, managerIds, sites } = req.body;
    if (!username || !password || !role)
        return res.status(400).json({ error: 'Champs manquants' });
    if (!mailRx.test(username))
        return res.status(400).json({ error: 'Username doit être prenom.nom@alten.com' });
    const list = (0, dataStore_1.read)(TABLE);
    if (list.some(u => u.username === username))
        return res.status(409).json({ error: 'Nom déjà pris' });
    if (role === 'manager' && managerIds?.length)
        return res.status(400).json({ error: 'Un manager ne peut avoir de managerIds' });
    if (role === 'caf' && (!managerIds || managerIds.length === 0))
        return res.status(400).json({ error: 'managerIds requis pour un CAF' });
    if (role === 'manager' && (!sites || sites.length === 0))
        return res.status(400).json({ error: 'sites requis pour un manager' });
    const user = {
        id: Date.now().toString(),
        username,
        password: hash(password),
        role: role,
        site: role === 'caf' ? site : undefined,
        managerIds: role === 'caf' ? managerIds : undefined,
        sites: role === 'manager' ? sites : undefined,
    };
    list.push(user);
    (0, dataStore_1.write)(TABLE, list);
    const { password: _p, ...clean } = user;
    res.status(201).json(clean);
});
/* ───────────── PATCH mot de passe ────────────── */
router.patch('/:id/password', (req, res) => {
    const { password } = req.body;
    if (!password)
        return res.status(400).json({ error: 'pwd manquant' });
    const list = (0, dataStore_1.read)(TABLE);
    const idx = list.findIndex(u => u.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Introuvable' });
    list[idx].password = hash(password);
    (0, dataStore_1.write)(TABLE, list);
    res.json({ ok: true });
});
/* ───────────── PATCH général ─────────────────── */
router.patch('/:id', (req, res) => {
    const data = req.body;
    const list = (0, dataStore_1.read)(TABLE);
    const idx = list.findIndex(u => u.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Introuvable' });
    if (data.username) {
        if (!mailRx.test(data.username))
            return res.status(400).json({ error: 'Username doit être prenom.nom@alten.com' });
        if (list.some(u => u.username === data.username && u.id !== req.params.id))
            return res.status(409).json({ error: 'Nom déjà pris' });
    }
    const updated = { ...list[idx], ...data };
    if (updated.role === 'manager' && updated.managerIds?.length)
        return res.status(400).json({ error: 'Un manager ne peut avoir de managerIds' });
    if (updated.role === 'caf' && (!updated.managerIds || updated.managerIds.length === 0))
        return res.status(400).json({ error: 'managerIds requis pour un CAF' });
    if (updated.role === 'manager' && (!updated.sites || updated.sites.length === 0))
        return res.status(400).json({ error: 'sites requis pour un manager' });
    Object.assign(list[idx], updated);
    (0, dataStore_1.write)(TABLE, list);
    const { password, ...clean } = list[idx];
    res.json(clean);
});
/* ───────────── DELETE ────────────────────────── */
router.delete('/:id', (req, res) => {
    const list = (0, dataStore_1.read)(TABLE);
    const after = list.filter(u => u.id !== req.params.id);
    if (after.length === list.length)
        return res.status(404).json({ error: 'Introuvable' });
    (0, dataStore_1.write)(TABLE, after);
    res.status(204).end();
});
exports.default = router;
