/* eslint-disable no-undef */
import fetch from 'node-fetch';
import { RetryConfigBuilder, RetryConfig, Retry, UntilLimit } from 'fail4ward-retry';


async function resetStats() {
  await fetch('http://localhost:8000/reset');
}

async function failingFn(timeout: number = 5000) {
  const url = `http://localhost:8000/error?timeout=${timeout}`;
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

async function successfulFn(afterAttempts: number = 5) {
  const url = `http://localhost:8000/success?after=${afterAttempts}`;
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

async function useRetryForFailingFn() {
  const maxAttempts:number = 5;
  const waitDuration:number = 1000;
  
  const retryConfig: RetryConfig = new RetryConfigBuilder()
    .withMaxAttempts(maxAttempts)
    .withWaitDuration(waitDuration)
    .withStrategy(UntilLimit)
    .build();
  
  const retry:Retry = Retry.With(retryConfig);
  
  // Start testing with failing function
  console.log('testing a failing function call');
  const failFn = retry.decoratePromise(failingFn);
  try {
    const res:Response = await failFn();
    const retryResponse:JSON = await res.json();
    console.log(`something went wrong, retry did not work. response: ${retryResponse}`);
  } catch(e) {
    console.log(`failed after ${maxAttempts} retries with ${waitDuration} backoff time`);
  }
};

async function useRetryForSuccessFn() {
  const maxAttempts:number = 5;
  const waitDuration:number = 1000;
  
  const retryConfig: RetryConfig = new RetryConfigBuilder()
    .withMaxAttempts(maxAttempts)
    .withWaitDuration(waitDuration)
    .withStrategy(UntilLimit)
    .build();
  
  const retry:Retry = Retry.With(retryConfig);  
  // Start testing with success function
  console.log('testing a successful function call');
  const successFn = retry.decoratePromise(successfulFn);
  try {
    const res:Response = await successFn();
    const retryResponse:JSON = await res.json();
    console.log(`something went wrong, retry did not work. response: ${retryResponse}`);
  } catch(e) {
    console.log(`success after ${maxAttempts} retries with ${waitDuration} backoff time`);
  }
};

async function useRetry() {
  await resetStats();
  await useRetryForFailingFn();
  await useRetryForSuccessFn();
}

useRetry();