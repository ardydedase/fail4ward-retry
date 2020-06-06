/* eslint-disable no-undef */
import fetch from 'node-fetch';

import { RetryConfigBuilder, RetryConfig, Retry, UntilLimit } from 'fail4ward-retry';


async function failingFn() {
    const url = 'http://localhost:8000/error?timeout=4000';
    console.log('fetching url: ', url);
    try {
      const res = await fetch(url);
      const {status} = res;
      if (status === 500) {
        throw new Error('server error');
      }
      return res;
    } catch(e) {
      throw new Error(e);
    }
}

async function getMyRepos() {
    const maxAttempts = 5;
    const waitDuration = 1000;

    const retryConfig: RetryConfig = new RetryConfigBuilder()
        .withMaxAttempts(maxAttempts)
        .withWaitDuration(waitDuration)
        .withStrategy(UntilLimit)
        .build();

    const retry = Retry.With(retryConfig);
    const fn = retry.decoratePromise(failingFn);
    try {
        const res = await fn();
        const retryResponse = await res.json();
        console.log('retryResponse: ', retryResponse);
    } catch(e) {
        console.log('exception here...');
        console.log(e);
    }

    
};

getMyRepos();
