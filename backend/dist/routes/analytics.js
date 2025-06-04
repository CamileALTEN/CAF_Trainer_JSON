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
exports.default = router;
