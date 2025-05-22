"use strict";
/* backend/src/routes/auth.ts
───────────────────────────────────────────────────────────────────────── */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dataStore_1 = require("../config/dataStore");
const notifier_1 = require("../utils/notifier");
const router = (0, express_1.Router)();
const USERS = 'users';
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;
/* ───────────────────────── LOGIN ───────────────────────── */
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = (0, dataStore_1.read)(USERS);
    const user = users.find(u => {
        if (u.username !== username)
            return false;
        /* mot de passe haché ? → bcrypt.compare */
        if (u.password.startsWith('$2'))
            return bcrypt_1.default.compareSync(password, u.password);
        /* anciens comptes demo non hachés */
        return u.password === password;
    });
    if (!user)
        return res.status(401).json({ error: 'Identifiants invalides' });
    const { id, role, site } = user;
    res.json({ id, username, role, site });
});
/* ───────────────────────── REGISTER ────────────────────── */
router.post('/register', (req, res) => {
    const { username, password, role, site, managerId } = req.body;
    if (!username || !password || !role)
        return res.status(400).json({ error: 'Champs manquants' });
    if (!mailRx.test(username))
        return res.status(400).json({ error: 'Format attendu : prenom.nom@alten.com' });
    const users = (0, dataStore_1.read)(USERS);
    if (users.some(u => u.username === username))
        return res.status(409).json({ error: 'Nom déjà pris' });
    const id = Date.now().toString();
    const newUser = {
        id,
        username,
        password: bcrypt_1.default.hashSync(password, 8),
        role,
        site,
        managerId,
    };
    users.push(newUser);
    (0, dataStore_1.write)(USERS, users);
    res.status(201).json({ id, username, role, site, managerId });
});
/* ───────────────────────── FORGOT PWD ───────────────────── */
router.post('/forgot', (req, res) => {
    const { username } = req.body;
    if (!username)
        return res.status(400).json({ error: 'Username requis' });
    const users = (0, dataStore_1.read)(USERS);
    const user = users.find(u => u.username === username);
    if (!user)
        return res.status(404).json({ error: 'Compte introuvable' });
    const message = 'Demande de réinitialisation de mot de passe';
    /* destinataires : tous les admins possédant une adresse valide + manager référent éventuel */
    const admins = users
        .filter(u => u.role === 'admin' && mailRx.test(u.username))
        .map(u => u.username);
    const managerMail = user.managerId
        ? users.find(u => u.id === user.managerId)?.username
        : undefined;
    const to = [
        ...admins,
        ...(managerMail && mailRx.test(managerMail) ? [managerMail] : []),
    ];
    if (to.length === 0) {
        console.error('[FORGOT] Aucun destinataire e‑mail valide');
        return res.status(500).json({ error: 'Aucun destinataire e‑mail valide' });
    }
    (0, notifier_1.notify)({
        username,
        category: 'password',
        message,
        to,
    })
        .then(() => res.json({ ok: true }))
        .catch(err => {
        console.error('[FORGOT]', err.message);
        res.status(500).json({ error: 'Envoi e‑mail impossible' });
    });
});
exports.default = router;
