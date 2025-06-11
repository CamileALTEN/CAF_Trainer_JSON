"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Stocke les vidéos dans le même dossier que celui exposé par index.ts
const DIR = path_1.default.resolve(__dirname, '../..', 'video');
if (!fs_1.default.existsSync(DIR))
    fs_1.default.mkdirSync(DIR);
router.post('/', (req, res) => {
    const { data } = req.body;
    if (!data)
        return res.status(400).json({ error: 'Donnée manquante' });
    const m = data.match(/^data:(video\/\w+);base64,(.+)$/);
    if (!m)
        return res.status(400).json({ error: 'Format invalide' });
    const ext = m[1].split('/')[1];
    const base64 = m[2];
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    fs_1.default.writeFileSync(path_1.default.join(DIR, name), base64, 'base64');
    res.json({ url: `/videos/${name}` });
});
exports.default = router;
