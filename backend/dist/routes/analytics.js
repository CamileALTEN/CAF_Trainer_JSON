"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_1 = require("../utils/analytics");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    try {
        const data = (0, analytics_1.computeAnalytics)();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Cannot load analytics' });
    }
});
router.post('/login', async (req, res) => {
    const { userId, role } = req.body;
    if (!userId || !role)
        return res.status(400).json({ error: 'Missing data' });
    await (0, analytics_1.startSession)(userId, role);
    res.json({ ok: true });
});
router.post('/logout', async (req, res) => {
    const { userId } = req.body;
    if (!userId)
        return res.status(400).json({ error: 'Missing data' });
    await (0, analytics_1.endSession)(userId);
    res.json({ ok: true });
});
router.post('/favorite', async (req, res) => {
    const { userId, itemId } = req.body;
    if (!userId || !itemId)
        return res.status(400).json({ error: 'Missing data' });
    await (0, analytics_1.recordFavorite)(userId, itemId);
    res.json({ ok: true });
});
router.get('/averages', (_req, res) => {
    try {
        const { averages } = (0, analytics_1.getAnalyticsFile)();
        res.json(averages || {});
    }
    catch {
        res.status(500).json({ error: 'Cannot load averages' });
    }
});
exports.default = router;
