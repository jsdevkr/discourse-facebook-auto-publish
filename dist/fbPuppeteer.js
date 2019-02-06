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
const puppeteer = require("puppeteer");
const helper_1 = require("./helper");
const ID = {
    login: '#m_login_email',
    pass: '#m_login_password',
    loginButton: 'button[data-sigil="touchable m_login_button"]',
    groupComposer: 'div[role="textbox"]',
    groupComposerTextFiled: 'textarea[data-sigil="composer-textarea m-textarea-input"]',
    groupSendPostBtn: 'button[data-sigil="submit_composer"]',
};
function puppeteerInit(fbUserId, fbUserPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications'],
        };
        if (process.env.NODE_ENV === 'development') {
            options.headless = false;
        }
        const browser = yield puppeteer.launch(options);
        const _page = yield browser.newPage();
        _page.on('dialog', (dialog) => __awaiter(this, void 0, void 0, function* () {
            console.log(dialog.message());
            yield dialog.accept();
        }));
        if (!fbUserId || !fbUserPassword) {
            throw 'now facebook account info';
        }
        yield _page.goto('https://m.facebook.com/', {
            waitUntil: 'networkidle2',
        });
        yield helper_1.sleep(3000);
        yield _page.waitForSelector(ID.login);
        yield _page.type(ID.login, fbUserId);
        yield _page.type(ID.pass, fbUserPassword);
        yield helper_1.sleep(1000);
        yield Promise.all([_page.waitForNavigation(), _page.click(ID.loginButton)]);
        yield _page.screenshot({
            path: 'public/after_login.png',
        });
        return _page;
    });
}
exports.puppeteerInit = puppeteerInit;
function takeScreenshot(fbPage, path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fbPage) {
            throw 'no facebook puppeteer page';
        }
        try {
            yield fbPage.screenshot({ path });
        }
        catch (error) {
            console.log('screenshot error:', 'public/before_group.png', error);
        }
    });
}
function gotoGroupAndPost(fbPage, facebookGroupId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fbPage) {
            throw 'no facebook puppeteer page';
        }
        try {
            yield Promise.all([fbPage.waitForNavigation(), fbPage.click('button[value="확인"]')]);
        }
        catch (e) {
            console.error(e);
        }
        yield takeScreenshot(fbPage, 'public/before_group.png');
        if (!facebookGroupId) {
            throw 'no facebook group url';
        }
        try {
            yield fbPage.goto(`https://m.facebook.com/groups/${facebookGroupId}`, {
                waitUntil: 'networkidle2',
            });
            yield helper_1.sleep(5000);
            yield fbPage.waitForSelector(ID.groupComposer);
            yield takeScreenshot(fbPage, 'public/after_groups.png');
            yield fbPage.click(ID.groupComposer);
            yield helper_1.sleep(5000);
            yield fbPage.waitForSelector(ID.groupComposerTextFiled);
            yield fbPage.click(ID.groupComposerTextFiled);
            yield fbPage.keyboard.type(message + ' ');
            yield takeScreenshot(fbPage, 'public/after_type.png');
            yield helper_1.sleep(5000);
            if (process.env.NODE_ENV === 'development') {
                yield fbPage.keyboard.press('Escape');
                yield fbPage.keyboard.press('Escape');
                yield fbPage.keyboard.press('Escape');
            }
            else {
                yield fbPage.click(ID.groupSendPostBtn);
            }
            yield helper_1.sleep(1000);
        }
        catch (e) {
            console.error(e);
            yield takeScreenshot(fbPage, 'public/group_error.png');
            throw e;
        }
    });
}
exports.gotoGroupAndPost = gotoGroupAndPost;
//# sourceMappingURL=fbPuppeteer.js.map