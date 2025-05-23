"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const PROGRESS = 'userProgress';
const MODULES = 'modules';
function mapItemsToModules(modules) {
    const map = new Map();
    const walk = (items, moduleId) => {
        items.forEach(it => {
            map.set(it.id, moduleId);
            if (it.children)
                walk(it.children, moduleId);
        });
    };
    modules.forEach(m => walk(m.items, m.id));
    return map;
}
function buildProgress(userId, username) {
    const modules = (0, dataStore_1.read)(MODULES);
    const map = mapItemsToModules(modules);
    const list = (0, dataStore_1.read)(PROGRESS).filter(p => p.userId === userId);
    const grouped = {};
    list.forEach(p => {
        const mId = map.get(p.itemId);
        if (!mId)
            return;
        if (p.status === 'non_commencé')
            return;
        if (!grouped[mId])
            grouped[mId] = [];
        grouped[mId].push(p.itemId);
    });
    return Object.entries(grouped).map(([moduleId, visited]) => ({
        username,
        moduleId,
        visited,
    }));
}
// GET /api/progress/:username – progression d'un CAF
router.get('/:username', (req, res) => {
    const users = (0, dataStore_1.read)('users');
    const user = users.find(u => u.username === req.params.username);
    if (!user)
        return res.status(404).json({ error: 'Utilisateur inconnu' });
    res.json(buildProgress(user.id, user.username));
});
// GET /api/progress?managerId=… – progression de tous les CAF d'un manager
router.get('/', (req, res) => {
    const { managerId } = req.query;
    const users = (0, dataStore_1.read)('users');
    const targets = managerId
        ? users.filter(u => u.managerId === managerId)
        : users.filter(u => u.role === 'caf');
    const result = [];
    targets.forEach(u => {
        result.push(...buildProgress(u.id, u.username));
    });
    res.json(result);
});
exports.default = router;
