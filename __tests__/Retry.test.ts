/* eslint-disable no-undef */
import 'jest';
import fetch from 'node-fetch';
import { RetryConfigBuilder, RetryConfig, Retry, UntilLimit } from '../src/index';


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

class Fail4ward {
  private baseUrl:string;
  constructor(baseUrl:string) {
    this.baseUrl = baseUrl;
  }

  async successAfter(after:number=10) {
    console.log('call successAfter');
    try {
      const res = await fetch(`${this.baseUrl}/success?after=${after}`);
      const {status} = res;
      if (status === 500) {
        throw new Error('server error');
      }
      return res;
    } catch(e) {
      throw new Error(e);
    }    
  }
}

describe('test retries', () => {
  let fail4ward:Fail4ward;
  beforeAll(() =>   {
    fail4ward = new Fail4ward('http://localhost:8000');
  });
 
  test('retry failing function', async() => {
    const maxAttempts = 5;
    const waitDuration = 1000;

    const retryConfig: RetryConfig = new RetryConfigBuilder()
      .withMaxAttempts(maxAttempts)
      .withWaitDuration(waitDuration)
      .withStrategy(UntilLimit)
      .build();

    const retry = Retry.With(retryConfig);
    
    expect(retry.retryConfig.maxAttempts).toBe(maxAttempts);
    expect(retry.retryConfig.waitDuration).toBe(waitDuration);
    expect(typeof retry.retryConfig.strategy).toBe('object');

    // test function
    const fn = retry.decoratePromise(fail4ward.successAfter);

    try {
      const res = await fn('function');
      console.log(res.json());
      // by the time it's successful, there should have been x retries
      if (res.status === 200) {
        throw new Error();
      }
      console.log(`getting status: ${res.status}`);
    } catch(e) {
      console.log(`maxAttempts: ${retry.retryConfig.strategy.current}`);
      expect(retry.retryConfig.strategy.current).toBeGreaterThanOrEqual(maxAttempts);
      expect(retry.retryConfig.strategy.timing.timeout()).toEqual(waitDuration);
      expect(e.message).toContain('Exceeded');
    }

  }, 30000);

  test('retry failing method', async() => {
    const maxAttempts = 8;
    const waitDuration = 1000;

    const retryConfig: RetryConfig = new RetryConfigBuilder()
      .withMaxAttempts(maxAttempts)
      .withWaitDuration(waitDuration)
      .withStrategy(UntilLimit)
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
      .withMaxAttempts(maxAttempts)
      .withWaitDuration(waitDuration)
      .withStrategy(UntilLimit)
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

