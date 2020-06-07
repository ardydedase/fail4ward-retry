/* eslint-disable no-undef */
import 'jest';
import fetch from 'node-fetch';
import { GenericContainer } from 'testcontainers';
import { RetryConfigBuilder, RetryConfig, Retry, UntilLimit } from '../src/index';

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

export class DummyService {
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


export class Fail4wardService {
  private baseUrl:string;
  private containerPort:number;
  private hostPort:number = 0;
  private container:any;

  constructor() {
    this.baseUrl = 'http://localhost';
    this.containerPort = 8000;
    
  }

  public async initContainer() {
    this.container = await this.startContainer();
    this.hostPort = this.container.getMappedPort(this.containerPort);
    const healthCheck = await this.getHealthCheck();
    console.log('healthCheck: ', await healthCheck.text());
  }

  private async getHealthCheck() {
    const healthCheck = await fetch(`${this.baseUrl}:${this.hostPort}/health`);
    return healthCheck;
  }
  
  private async startContainer() {
    const container = await new GenericContainer('ardydedase/fail4ward', 'latest')
      .withExposedPorts(this.containerPort)
      .start();
    return container;  
  }

  public async successAfter(after:number=10) {
    console.log('call successAfter');
    try {
      const res = await fetch(`${this.baseUrl}:${this.hostPort}/success?after=${after}`);
      const {status} = res;
      if (status === 500) {
        throw new Error('server error');
      }
      return res;
    } catch(e) {
      throw new Error(e);
    }    
  }

  public async stopContainer() {
    await this.container.stop();
    console.log('stopped container');
  }
}

// Start tests

describe('test retries', () => {
  let fail4wardSvc:Fail4wardService;
  beforeAll(() => {
    fail4wardSvc = new Fail4wardService();
  });

  afterAll(async() => {
    await fail4wardSvc.stopContainer();
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

    // initialise the service container
    await fail4wardSvc.initContainer();
    // test function
    const fn = retry.decoratePromise(fail4wardSvc.successAfter);

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
    
  }, 50000);
  
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

