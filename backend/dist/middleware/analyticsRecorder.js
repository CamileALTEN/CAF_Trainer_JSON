"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRecorder = void 0;
const analytics_1 = require("../utils/analytics");
function analyticsRecorder(req, _res, next) {
    (0, analytics_1.recordEvent)(req);
    next();
}
exports.analyticsRecorder = analyticsRecorder;
