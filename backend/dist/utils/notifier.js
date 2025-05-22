"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = void 0;
const dataStore_1 = require("../config/dataStore");
const mailer_1 = require("./mailer");
const TABLE = 'notifications';
async function notify(options) {
    const list = (0, dataStore_1.read)(TABLE);
    const entry = {
        id: Date.now().toString(),
        username: options.username,
        date: new Date().toISOString(),
        category: options.category,
        message: options.message,
    };
    list.push(entry);
    (0, dataStore_1.write)(TABLE, list);
    if (options.to.length > 0) {
        await (0, mailer_1.sendMail)(options.to, 'CAF\u2011Trainer notification', `<p>${options.message}</p>`);
    }
}
exports.notify = notify;
