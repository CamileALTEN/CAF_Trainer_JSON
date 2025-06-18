"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataStore_1 = require("../config/dataStore");
const router = (0, express_1.Router)();
const TABLE = 'settings';
function load() {
    return (0, dataStore_1.read)(TABLE)[0] ?? { mailEnabled: true };
}
function save(s) {
    (0, dataStore_1.write)(TABLE, [s]);
}
router.get('/', (_req, res) => {
    res.json(load());
});
router.put('/', (req, res) => {
    const { mailEnabled, admin } = req.body;
    const settings = load();
    if (typeof mailEnabled === 'boolean') {
        settings.mailEnabled = mailEnabled;
        console.log(`[SETTINGS] mailEnabled=${mailEnabled} by ${admin || 'unknown'} at ${new Date().toISOString()}`);
    }
    save(settings);
    res.json(settings);
});
exports.default = router;
