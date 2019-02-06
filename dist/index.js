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
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const fbPuppeteer_1 = require("./fbPuppeteer");
const helper_1 = require("./helper");
const app = express();
const port = process.env.PORT || 8080;
function getCategoryName(categoryId) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield rp({
            uri: process.env.DISCOURSE_URL + '/site.json',
            json: true,
        });
        if (results && results.categories) {
            const currentCategory = results.categories.find((category) => {
                return category.id === categoryId;
            });
            let displayNames = currentCategory.name;
            if (currentCategory.parent_category_id) {
                const parentName = yield getCategoryName(currentCategory.parent_category_id);
                displayNames = `${parentName}/${displayNames}`;
            }
            return displayNames;
        }
        else {
            throw new Error('categories.json scheme error');
        }
    });
}
function shareToFBGroup(topic, delay = 0) {
    return new Promise((resolve, reject) => {
        let tryCount = 1;
        const errors = [];
        (function runner() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (topic && topic.id && topic.archetype === 'regular') {
                        yield helper_1.sleep(delay);
                        const updatedTopic = yield rp({
                            uri: process.env.DISCOURSE_URL + '/t/' + topic.id + '.json',
                            json: true,
                        });
                        if (!updatedTopic) {
                            return;
                        }
                        const displayCategoryName = yield getCategoryName(updatedTopic.category_id)
                            .catch(() => {
                            return '';
                        })
                            .then(name => (name ? `[${name}] ` : ''));
                        const message = `${displayCategoryName}${updatedTopic.title}\nby @${topic.created_by.username} ${process.env.DISCOURSE_URL}/t/${topic.id}`;
                        console.log(message);
                        yield fbPuppeteer_1.gotoGroupAndPost(message);
                        console.log('fb posting successful', new Date());
                    }
                    resolve();
                }
                catch (error) {
                    errors.push(error);
                    if (tryCount < 3) {
                        tryCount++;
                        runner();
                    }
                    else {
                        reject(errors);
                    }
                }
            });
        })();
    });
}
app.use(bodyParser.json());
app.use(express.static('public'));
app.post('/discoursehook', function (req, res) {
    const eventType = req.get('X-Discourse-Event');
    console.log(eventType);
    if (eventType === 'topic_created') {
        helper_1.promiseQueue.push(() => shareToFBGroup(req.body.topic, 30 * 1000));
    }
    res.json({
        id: req.body.topic.id,
        title: req.body.topic.title,
        eventType,
    });
});
app.post('/discoursehook_delay', function (req, res) {
    const eventType = req.get('X-Discourse-Event');
    console.log(eventType);
    if (eventType === 'topic_created') {
        helper_1.promiseQueue.push(() => shareToFBGroup(req.body.topic, 60 * 1000 * (typeof process.env.POSTED_AFTER_MIN === 'number' ? process.env.POSTED_AFTER_MIN || 5 : 5)));
    }
    res.json({
        id: req.body.topic.id,
        title: req.body.topic.title,
        eventType,
    });
});
app.get('/', (req, res) => {
    console.log('Hello World!');
    res.json({
        success: true,
    });
});
app.listen(port, function () {
    console.log(`Server listening on port ${port}!`);
});
//# sourceMappingURL=index.js.map