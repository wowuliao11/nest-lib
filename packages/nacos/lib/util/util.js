"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeParseJson = safeParseJson;
exports.isEmpty = isEmpty;
function safeParseJson(json) {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        return null;
    }
}
function isEmpty(value) {
    return value === undefined || value === null || value === "";
}
//# sourceMappingURL=util.js.map