"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const NOTIFS = 'notifications';
/**
  * GET /api/notifications
  */
router.get('/', (req, res) => {
    res.json((0, dataStore_1.read)(NOTIFS));
});
// GET /api/notifications/for/:username – toutes les notifs ciblant l'utilisateur
router.get('/for/:username', (req, res) => {
    const list = (0, dataStore_1.read)(NOTIFS);
    const { username } = req.params;
    const result = list.filter((n) => !n.cible || n.cible.includes(username) || n.username === username);
    res.json(result);
});
/**
* POST /api/notifications
* Body: { username, date, message? }
*/
router.post('/', (req, res) => {
    const notifs = (0, dataStore_1.read)(NOTIFS);
    const entry = {
        id: Date.now().toString(),
        dateEnvoi: new Date().toISOString(),
        date: new Date().toISOString(),
        ...req.body,
        etat: {
            luPar: [],
            nonLuPar: req.body.cible ? [...req.body.cible] : [],
        },
    };
    notifs.push(entry);
    (0, dataStore_1.write)(NOTIFS, notifs);
    res.status(201).json(entry);
});
// PATCH /api/notifications/:id/read – marque une notif comme lue par username
router.patch('/:id/read', (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    const notifs = (0, dataStore_1.read)(NOTIFS);
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Not found' });
    }
    const state = notifs[idx].etat || { luPar: [], nonLuPar: [] };
    if (!state.luPar.includes(username))
        state.luPar.push(username);
    state.nonLuPar = state.nonLuPar.filter((u) => u !== username);
    notifs[idx].etat = state;
    (0, dataStore_1.write)(NOTIFS, notifs);
    res.json({ ok: true });
});
exports.default = router;
