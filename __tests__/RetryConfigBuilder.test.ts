/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import 'jest';
import { RetryConfigBuilder, RetryConfig, Retry } from '../src/retry/index';
import { UntilLimit } from '../src/retry/strategies';


function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

class DummyService {
  get(forceFailure: boolean = false) {
      return new Promise((resolve, reject) => {
          // 99 / 100 times return a good response
          let num = getRandomInt(100);
          if (forceFailure) {
            num = 0;
          }
          if (num === 0) {
              reject(new Error('failed'));
          }
          resolve('success');
      });
  }

  failingFn(msg: string) {
    return new Promise((_, reject) => {
      reject(new Error(msg + '_failure'));
    });
  }
}

const failingFn = (msg: string) => {
  return new Promise((_, reject) => {
      reject(new Error(msg + '_failure'));
  });
};

describe('test retries', () => {
  test('retry failing function', async() => {
    const maxAttempts = 5;
    const waitDuration = 1000;

    const retryConfig: RetryConfig = new RetryConfigBuilder()
      .maxAttempts(maxAttempts)
      .waitDuration(waitDuration)
      .strategy(UntilLimit)
      .build();

    const retry = Retry.With(retryConfig);
    
    expect(retry.retryConfig.maxAttempts).toBe(maxAttempts);
    expect(retry.retryConfig.waitDuration).toBe(waitDuration);
    expect(typeof retry.retryConfig.strategy).toBe('object');

    // test function
    const fn = retry.decoratePromise(failingFn);

    try {
      await fn('function');
    } catch(e) {
      expect(retry.retryConfig.strategy.current).toBeGreaterThanOrEqual(maxAttempts);
      expect(retry.retryConfig.strategy.timing.timeout()).toEqual(waitDuration);
      expect(e.message).toContain('function_failure');
    }

  });

  test('retry failing method', async() => {
    const maxAttempts = 8;
    const waitDuration = 1000;

    const retryConfig: RetryConfig = new RetryConfigBuilder()
      .maxAttempts(maxAttempts)
      .waitDuration(waitDuration)
      .strategy(UntilLimit)
      .build();

    const retry = Retry.With(retryConfig);
    
    expect(retry.retryConfig.maxAttempts).toBe(maxAttempts);
    expect(retry.retryConfig.waitDuration).toBe(waitDuration);
    expect(typeof retry.retryConfig.strategy).toBe('object');

    const service = new DummyService();
    const failingSvc = retry.decoratePromise(service.failingFn);

    try {
      await failingSvc('class');
    } catch(e) {
      expect(retry.retryConfig.strategy.current).toBeGreaterThanOrEqual(maxAttempts);
      expect(retry.retryConfig.strategy.timing.timeout()).toEqual(waitDuration);
      expect(e.message).toContain('class_failure');
    }

  });  


  test('retry randomly failing method', async() => {
    const maxAttempts = 8;
    const waitDuration = 500;

    const retryConfig: RetryConfig = new RetryConfigBuilder()
      .maxAttempts(maxAttempts)
      .waitDuration(waitDuration)
      .strategy(UntilLimit)
      .build();

    const retry = Retry.With(retryConfig);
    
    expect(retry.retryConfig.maxAttempts).toBe(maxAttempts);
    expect(retry.retryConfig.waitDuration).toBe(waitDuration);
    expect(typeof retry.retryConfig.strategy).toBe('object');

    const service = new DummyService();
    const randomSvc = retry.decoratePromise(service.get);

    let num = 0;

    while (num < 101) {
      try {
        await randomSvc();
      } catch(e) {
        throw new Error(e);
      }
      num++;
    }

    num = 0;
    // force failure
    while (num < 101) {
      try {
        const forceFailure = true;
        await randomSvc(forceFailure);
      } catch(e) {
        expect(e.message).toContain('Exceeded');
      }
      num++;
    }    

  });    

});

