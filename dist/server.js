"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const fbPuppeteer_1 = require("./fbPuppeteer");
const helper_1 = require("./helper");
class Server {
    constructor(options) {
        this.getCategoryName = (categoryId) => __awaiter(this, void 0, void 0, function* () {
            const results = yield rp({
                uri: this.discourseUrl + '/site.json',
                json: true,
            });
            if (results && results.categories) {
                const currentCategory = results.categories.find((category) => {
                    return category.id === categoryId;
                });
                let displayNames = currentCategory.name;
                if (currentCategory.parent_category_id) {
                    const parentName = yield this.getCategoryName(currentCategory.parent_category_id);
                    displayNames = `${parentName}/${displayNames}`;
                }
                return displayNames;
            }
            else {
                throw new Error('categories.json scheme error');
            }
        });
        this.shareToFBGroup = (topic, delay = 0) => __awaiter(this, void 0, void 0, function* () {
            let success = false;
            let tryCount = 1;
            const errors = [];
            while (!success) {
                try {
                    if (topic && topic.id && topic.archetype === 'regular') {
                        yield helper_1.sleep(delay);
                        const updatedTopic = yield rp({
                            uri: this.discourseUrl + '/t/' + topic.id + '.json',
                            json: true,
                        });
                        if (!updatedTopic) {
                            return;
                        }
                        const displayCategoryName = yield this.getCategoryName(updatedTopic.category_id)
                            .catch(() => {
                            return '';
                        })
                            .then(name => (name ? `[${name}] ` : ''));
                        const message = `${displayCategoryName}${updatedTopic.title}\nby @${topic.created_by.username} ${this.discourseUrl}/t/${topic.id}`;
                        console.log(message);
                        if (!this.fbPage) {
                            this.fbPage = yield fbPuppeteer_1.puppeteerInit(this.fbUserId, this.fbUserPassword);
                        }
                        yield fbPuppeteer_1.gotoGroupAndPost(this.fbPage, this.facebookGroupUrl, message);
                        console.log('fb posting successful', new Date());
                    }
                    success = true;
                }
                catch (error) {
                    errors.push(error);
                    if (tryCount < 3) {
                        this.fbPage = null;
                        tryCount++;
                    }
                    else {
                        throw errors;
                    }
                }
            }
        });
        this.createApp = () => {
            this.app = express();
            this.app.use(bodyParser.json());
            this.app.use(express.static('public'));
            this.app.post('/discoursehook', (req, res) => {
                const eventType = req.get('X-Discourse-Event');
                console.log(eventType);
                if (eventType === 'topic_created') {
                    helper_1.promiseQueue.push(() => this.shareToFBGroup(req.body.topic, 30 * 1000));
                }
                res.json({
                    id: req.body.topic.id,
                    title: req.body.topic.title,
                    eventType,
                });
            });
            this.app.post('/discoursehook_delay', (req, res) => {
                const eventType = req.get('X-Discourse-Event');
                console.log(eventType);
                if (eventType === 'topic_created') {
                    helper_1.promiseQueue.push(() => this.shareToFBGroup(req.body.topic, 60 * 1000 * this.postedAfterMin));
                }
                res.json({
                    id: req.body.topic.id,
                    title: req.body.topic.title,
                    eventType,
                });
            });
            this.app.get('/', (req, res) => {
                console.log('Hello World!');
                res.json({
                    success: true,
                });
            });
            this.app.listen(this.port, () => {
                console.log(`Server listening on port ${this.port}!`);
            });
        };
        if (!options.discourseUrl || !options.facebookGroupUrl || !options.fbUserId || !options.fbUserPassword) {
            throw 'invalid options';
        }
        this.port = options.port || 8080;
        this.discourseUrl = options.discourseUrl;
        this.postedAfterMin = options.postedAfterMin || 5;
        this.facebookGroupUrl = options.facebookGroupUrl;
        this.fbUserId = options.fbUserId;
        this.fbUserPassword = options.fbUserPassword;
        this.createApp();
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map