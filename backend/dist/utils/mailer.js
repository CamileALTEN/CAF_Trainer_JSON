"use strict";
/* backend/src/utils/mailer.ts
    ─────────────────────────────────────────────────────────────────────────
    Gestion SMTP (OVH) : 3 ports tentés : 25 → 587 → 465
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dataStore_1 = require("../config/dataStore");
/* ---------- variables d’env. ---------- */
const { MAIL_USER = '', // ex. services@conforea.fr
MAIL_PASS = '', // ex. Test2025!
MAIL_HOST = 'ns0.ovh.net', // hôte SMTP OVH
 } = process.env;
const PORTS = [587]; // ordre de tentative
/* ---------- helper exporté ---------- */
async function sendMail(to, // accepte tableau ou chaîne
subject, html) {
    const settings = (0, dataStore_1.read)('settings')[0];
    if (settings && settings.mailEnabled === false) {
        console.log('[MAIL] Envoi bloqué : système désactivé');
        return;
    }
    if (!MAIL_USER || !MAIL_PASS) {
        throw new Error('MAIL_USER ou MAIL_PASS manquant dans .env');
    }
    let lastErr = null;
    for (const port of PORTS) {
        try {
            console.log(`[MAIL] Tentative via port ${port}…`);
            /* options typées pour éviter l’erreur TS2353 */
            const opts = {
                host: MAIL_HOST,
                port,
                secure: port === 465,
                auth: { user: MAIL_USER, pass: MAIL_PASS },
                connectionTimeout: 15000,
            };
            const transporter = nodemailer_1.default.createTransport(opts);
            await transporter.verify(); // vérifie la connexion
            await transporter.sendMail({
                from: `"CAF‑Trainer" <${MAIL_USER}>`,
                to,
                subject,
                html,
            });
            console.log(`[MAIL] OK via port ${port}`);
            return; // ← succès ! on sort
        }
        catch (err) {
            lastErr = err;
            console.error(`[MAIL] Échec sur le port ${port} :`, err.message);
        }
    }
    /* si aucune tentative n’a réussi */
    throw lastErr ?? new Error('Envoi courriel impossible');
}
exports.sendMail = sendMail;
