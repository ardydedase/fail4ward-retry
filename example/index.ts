/* eslint-disable no-undef */
import fetch from 'node-fetch';
import { GenericContainer } from 'testcontainers';
import { RetryConfigBuilder, RetryConfig, Retry, UntilLimit } from 'fail4ward-retry';


async function resetStats(hostPort: number) {
  await fetch(`http://localhost:${hostPort}/reset`);
}

async function runFail4wardContainer(containerPort: number) {
  // run container for testing failing service.
  const container = await new GenericContainer('ardydedase/fail4ward', 'latest')
    .withExposedPorts(containerPort)
    .start();  

  return container;
}

async function failingFn(hostPort: number, timeout: number = 5000) {
  const url = `http://localhost:${hostPort}/error?timeout=${timeout}`;
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

async function successfulFn(hostPort: number, afterAttempts: number = 5) {
  const url = `http://localhost:${hostPort}/success?after=${afterAttempts}`;
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

async function useRetryForFailingFn(hostPort: number) {
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
    const res:Response = await failFn(hostPort);
    const retryResponse:JSON = await res.json();
    console.log(`something went wrong, retry did not work. response: ${retryResponse}`);
  } catch(e) {
    console.log(`failed after ${maxAttempts} retries with ${waitDuration} backoff time`);
  }
};

async function useRetryForSuccessFn(hostPort: number) {
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
    const res:Response = await successFn(hostPort);
    const retryResponse:JSON = await res.json();
    console.log(`something went wrong, retry did not work. response: ${retryResponse}`);
  } catch(e) {
    console.log(`success after ${maxAttempts} retries with ${waitDuration} backoff time`);
  }
};

async function useRetry() {
  const containerPort: number = 8000;
  const container = await runFail4wardContainer(containerPort);
  const hostPort: number = container.getMappedPort(containerPort);
  await resetStats(hostPort);
  await useRetryForFailingFn(hostPort);
  await useRetryForSuccessFn(hostPort);
}

useRetry();