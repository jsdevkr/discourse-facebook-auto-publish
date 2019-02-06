"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
const server_1 = require("./server");
const optionConfig = {
    port: 'PORT',
    postedAfterMin: 'POSTED_AFTER_MIN',
    discourseUrl: 'DISCOURSE_URL',
    facebookGroupId: 'FACEBOOK_GROUP_ID',
    fbUserId: 'FACEBOOK_USER',
    fbUserPassword: 'FACEBOOK_PASS',
};
function creatServer(idx) {
    const option = {};
    const prefix = `SITE_${idx}`;
    Object.keys(optionConfig).forEach(key => {
        const value = optionConfig[key];
        const processValue = process.env[`${prefix}_${value}`];
        if (processValue) {
            option[key] = processValue;
        }
    });
    if (Object.keys(option).length) {
        new server_1.default(option);
        creatServer(++idx);
    }
}
creatServer(0);
//# sourceMappingURL=index.js.map