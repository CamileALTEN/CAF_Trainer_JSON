"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Charger **immédiatement** le .env du dossier backend
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const modules_1 = __importDefault(require("./routes/modules"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const progress_1 = __importDefault(require("./routes/progress"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const checklist_1 = __importDefault(require("./routes/checklist"));
const images_1 = __importDefault(require("./routes/images"));
const videos_1 = __importDefault(require("./routes/videos"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const quiz_1 = __importDefault(require("./routes/quiz"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const IMG_DIR = path_1.default.resolve(__dirname, '../image');
if (!fs_1.default.existsSync(IMG_DIR))
    fs_1.default.mkdirSync(IMG_DIR);
const VID_DIR = path_1.default.resolve(__dirname, '../video');
if (!fs_1.default.existsSync(VID_DIR))
    fs_1.default.mkdirSync(VID_DIR);
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '200mb' }));
app.use('/images', express_1.default.static(IMG_DIR));
app.use('/videos', express_1.default.static(VID_DIR));
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/modules', modules_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/progress', progress_1.default);
app.use('/api/tickets', tickets_1.default);
app.use('/api/checklist-url', checklist_1.default);
app.use('/api/images', images_1.default);
app.use('/api/videos', videos_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/quiz-results', quiz_1.default);
app.get('/', (_req, res) => {
    res.send('🚀 Backend TS démarré !');
});
app.listen(PORT, () => {
    console.log(`🚀 Backend TS sur http://localhost:${PORT}`);
});
