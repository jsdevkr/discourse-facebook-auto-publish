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
exports.sleep = (ms) => __awaiter(this, void 0, void 0, function* () {
    return new Promise(res => {
        setTimeout(() => {
            res();
        }, ms);
    });
});
exports.promiseQueue = (() => {
    const _queue = [];
    let _promise = null;
    return {
        _next: function () {
            const run = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (_queue.length) {
                        const fn = _queue.shift();
                        yield fn();
                    }
                    if (!_queue.length) {
                        _promise = null;
                    }
                }
                catch (error) {
                    console.error(error);
                    throw error;
                }
            });
            _promise = (_promise || Promise.resolve()).then(run, run);
        },
        push: function (fn) {
            _queue.push(fn);
            this._next();
            return this;
        },
    };
})();
//# sourceMappingURL=helper.js.map