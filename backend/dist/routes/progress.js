"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const notifier_1 = require("../utils/notifier");
const router = (0, express_1.Router)();
const TABLE = 'progress';
// GET /api/progress/:username – lecture complète d’un CAF
router.get('/:username', (req, res) => {
    const rows = (0, dataStore_1.read)(TABLE).filter((p) => p.username === req.params.username);
    res.json(rows);
});
// PATCH /api/progress – MAJ d'un module
router.patch('/', (req, res) => {
    const { username, moduleId, visited = [], started = [], needValidation = [], } = req.body;
    if (!username || !moduleId) {
        return res.status(400).json({ error: 'Données manquantes' });
    }
    const uniqVisited = Array.from(new Set(visited));
    const uniqNeedVal = Array.from(new Set(needValidation)).filter((id) => !uniqVisited.includes(id));
    const uniqStarted = Array.from(new Set(started))
        .filter((id) => !uniqVisited.includes(id) && !uniqNeedVal.includes(id));
    const list = (0, dataStore_1.read)(TABLE);
    const idx = list.findIndex((p) => p.username === username && p.moduleId === moduleId);
    const modules = (0, dataStore_1.read)('modules');
    const mod = modules.find((m) => m.id === moduleId);
    const collectIds = (items) => items.reduce((arr, it) => [...arr, it.id, ...(it.children ? collectIds(it.children) : [])], []);
    const allIds = mod ? collectIds(mod.items) : [];
    const previouslyVisited = idx === -1 ? [] : list[idx].visited;
    if (idx === -1) {
        list.push({ username, moduleId, visited: uniqVisited, started: uniqStarted, needValidation: uniqNeedVal });
    }
    else {
        list[idx].visited = uniqVisited;
        list[idx].started = uniqStarted;
        list[idx].needValidation = uniqNeedVal;
    }
    const nowCompleted = allIds.length > 0 && allIds.every((id) => uniqVisited.includes(id));
    const wasCompleted = allIds.length > 0 && allIds.every((id) => previouslyVisited.includes(id));
    if (mod && nowCompleted && !wasCompleted) {
        (0, notifier_1.createNotificationAuto)({
            type: 'success',
            message: `Bravo, vous avez terminé le module "${mod.title}" !`,
            cible: [username],
            origine: 'module_completed',
        });
    }
    (0, dataStore_1.write)(TABLE, list);
    res.json({ ok: true });
});
// GET /api/progress?managerId=… – progression de tous les CAF d’un manager
router.get('/', (req, res) => {
    const { managerId } = req.query;
    const rows = (0, dataStore_1.read)(TABLE);
    const users = (0, dataStore_1.read)('users');
    if (managerId) {
        const cafIds = users.filter(u => u.managerIds?.includes(managerId)).map(u => u.username);
        return res.json(rows.filter(r => cafIds.includes(r.username)));
    }
    res.json(rows);
});
exports.default = router;
