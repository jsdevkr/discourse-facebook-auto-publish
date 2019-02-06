"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
const server_1 = require("./server");
new server_1.default({
    port: Number(process.env.PORT),
    discourseUrl: process.env.DISCOURSE_URL,
    postedAfterMin: Number(process.env.POSTED_AFTER_MIN),
    facebookGroupUrl: process.env.FACEBOOK_GROUP_URL,
    fbUserId: process.env.FACEBOOK_USER,
    fbUserPassword: process.env.FACEBOOK_PASS,
});
//# sourceMappingURL=index.js.map