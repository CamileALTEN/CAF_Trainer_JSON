"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const notifier_1 = require("../utils/notifier");
const router = (0, express_1.Router)();
const TABLE = 'modules';
function notifyReaders(moduleId, message, origine) {
    const progress = (0, dataStore_1.read)('progress');
    const users = progress
        .filter(p => p.moduleId === moduleId && p.visited.length > 0)
        .map(p => p.username);
    if (users.length) {
        (0, notifier_1.createNotificationAuto)({
            type: 'system',
            message,
            cible: Array.from(new Set(users)),
            origine,
        });
    }
}
// ----- utilitaires -----
function load() {
    return (0, dataStore_1.read)(TABLE);
}
function save(list) {
    (0, dataStore_1.write)(TABLE, list);
}
function byId(id, list = load()) {
    return list.find((m) => m.id === id);
}
function idx(id, list = load()) {
    return list.findIndex((m) => m.id === id);
}
function findItem(items, id) {
    for (const it of items) {
        if (it.id === id)
            return it;
        const sub = findItem(it.children ?? [], id);
        if (sub)
            return sub;
    }
    return null;
}
// GET /api/modules
router.get('/', (_req, res) => res.json(load()));
// GET /api/modules/:id
router.get('/:id', (req, res) => {
    const mod = byId(req.params.id);
    return mod ? res.json(mod) : res.status(404).json({ error: 'Module non trouvé' });
});
// GET /api/modules/:moduleId/items/:itemId
router.get('/:moduleId/items/:itemId', (req, res) => {
    const mod = byId(req.params.moduleId);
    if (!mod)
        return res.status(404).json({ error: 'Module non trouvé' });
    const item = findItem(mod.items, req.params.itemId);
    return item ? res.json(item) : res.status(404).json({ error: 'Item non trouvé' });
});
// PATCH /api/modules/:moduleId/items/:itemId/outdated
router.patch('/:moduleId/items/:itemId/outdated', (req, res) => {
    const list = load();
    const mod = byId(req.params.moduleId, list);
    if (!mod)
        return res.status(404).json({ error: 'Module non trouvé' });
    const item = findItem(mod.items, req.params.itemId);
    if (!item)
        return res.status(404).json({ error: 'Item non trouvé' });
    const info = req.body || null;
    if (info) {
        item.outdatedInfo = {
            reason: String(info.reason || ''),
            date: String(info.date || new Date().toISOString()),
            user: String(info.user || ''),
            site: info.site ? String(info.site) : undefined,
        };
    }
    else {
        delete item.outdatedInfo;
    }
    save(list);
    notifyReaders(mod.id, `Le module "${mod.title}" a été mis à jour`, 'module_update');
    res.json(item);
});
// POST /api/modules
router.post('/', (req, res) => {
    const list = load();
    const id = Date.now().toString();
    const mod = {
        id,
        title: req.body.title ?? 'Nouveau module',
        summary: req.body.summary ?? '',
        enabled: true,
        items: [],
    };
    list.push(mod);
    save(list);
    const users = (0, dataStore_1.read)('users').filter(u => u.role === 'caf').map(u => u.username);
    if (users.length) {
        (0, notifier_1.createNotificationAuto)({
            type: 'recommandation',
            message: `Nouveau module disponible : ${mod.title}`,
            cible: users,
            action: { type: 'link', url: `/modules/${mod.id}` },
            origine: 'new_module',
        });
    }
    res.status(201).json(mod);
});
// PUT /api/modules/:id
router.put('/:id', (req, res) => {
    const list = load();
    const index = idx(req.params.id, list);
    if (index === -1)
        return res.status(404).json({ error: 'Module non trouvé' });
    list[index] = req.body;
    save(list);
    notifyReaders(req.params.id, `Le module "${list[index].title}" a été mis à jour`, 'module_update');
    res.json(list[index]);
});
// PATCH /api/modules/:id
router.patch('/:id', (req, res) => {
    const list = load();
    const mod = byId(req.params.id, list);
    if (!mod)
        return res.status(404).json({ error: 'Module non trouvé' });
    Object.assign(mod, req.body);
    save(list);
    notifyReaders(mod.id, `Le module "${mod.title}" a été mis à jour`, 'module_update');
    res.json(mod);
});
// DELETE /api/modules/:id
router.delete('/:id', (req, res) => {
    const list = load();
    const index = idx(req.params.id, list);
    if (index === -1)
        return res.status(404).json({ error: 'Module non trouvé' });
    list.splice(index, 1);
    save(list);
    res.status(204).end();
});
exports.default = router;
