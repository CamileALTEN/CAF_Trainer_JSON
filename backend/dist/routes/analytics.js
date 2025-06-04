"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const DATA_FILE = path_1.default.resolve(__dirname, '../data/analytics.json');
router.get('/', (_req, res) => {
    try {
        const data = fs_1.default.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    }
    catch (err) {
        res.status(500).json({ error: 'Cannot load analytics' });
    }
});
exports.default = router;
