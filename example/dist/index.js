"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-undef */
const node_fetch_1 = require("node-fetch");
const fail4ward_retry_1 = require("fail4ward-retry");
function failingFn() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = 'http://localhost:8000/error?timeout=4000';
        console.log('fetching url: ', url);
        try {
            const res = yield node_fetch_1.default(url);
            const { status } = res;
            if (status === 500) {
                throw new Error('server error');
            }
            return res;
        }
        catch (e) {
            throw new Error(e);
        }
    });
}
function getMyRepos() {
    return __awaiter(this, void 0, void 0, function* () {
        // const myRepo = new GitHub('ardydedase');
        // const repos = await myRepo.getRepos();
        // const response = await repos.json();
        // console.log('getMyRepos response: ', response);
        const maxAttempts = 5;
        const waitDuration = 1000;
        const retryConfig = new fail4ward_retry_1.RetryConfigBuilder()
            .withMaxAttempts(maxAttempts)
            .withWaitDuration(waitDuration)
            .withStrategy(fail4ward_retry_1.UntilLimit)
            .build();
        const retry = fail4ward_retry_1.Retry.With(retryConfig);
        const fn = retry.decoratePromise(failingFn);
        try {
            const res = yield fn();
            const retryResponse = yield res.json();
            console.log('retryResponse: ', retryResponse);
        }
        catch (e) {
            console.log('exception here...');
            console.log(e);
        }
    });
}
;
getMyRepos();
