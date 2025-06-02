"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const TABLE = 'checklist';
function load() {
    const list = (0, dataStore_1.read)(TABLE);
    return list[0] ?? { url: '' };
}
function save(conf) {
    (0, dataStore_1.write)(TABLE, [conf]);
}
router.get('/', (_req, res) => {
    res.json(load());
});
router.put('/', (req, res) => {
    const { url } = req.body;
    if (typeof url !== 'string') {
        return res.status(400).json({ error: 'url manquante' });
    }
    save({ url });
    res.json({ url });
});
exports.default = router;
