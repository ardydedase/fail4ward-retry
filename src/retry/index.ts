import { FixedInterval } from './timing'
import { exception } from 'console';

export interface RetryConfig {
  strategy?: any,
  maxAttempts: number,
  waitDuration: number, // ms
}

export class RetryConfigBuilder {
  private readonly _retryConfig: RetryConfig;

  constructor() {
    this._retryConfig = {
      maxAttempts: 0,
      waitDuration: 0,
    };
  }

  withMaxAttempts(maxAttempts: number): RetryConfigBuilder {
    this._retryConfig.maxAttempts = maxAttempts;
    return this;
  }

  withWaitDuration(waitDuration: number): RetryConfigBuilder {
    this._retryConfig.waitDuration = waitDuration;
    return this;
  }

  withStrategy(retryStrategy: any): RetryConfigBuilder {
    if (this._retryConfig.waitDuration <= 0 
      || this._retryConfig.maxAttempts <= 0) {
      throw exception('set required arguments');
    }
    this._retryConfig.strategy = retryStrategy.New(
      FixedInterval.New(this._retryConfig.waitDuration), 
      this._retryConfig.maxAttempts);
    return this;
  }

  build():RetryConfig {
    return this._retryConfig;
  }
}


class RetryError extends Error {
  constructor(m: string) {
      super(m);
      // Set the prototype explicitly.
      Object.setPrototypeOf(this, RetryError.prototype);
  }

  exceededRetries() {
      this.message = `Exceeded retries caused by error: ${this.message}`;
      return this;
  }
}

export class Retry {
  retryConfig: RetryConfig;
  public constructor(retryConfig: RetryConfig) {
    this.retryConfig = retryConfig;
  }

  public retrier(fn: any, ...args: any) {
    return fn(...args)
    .catch((e: any) => {
      if (this.retryConfig.strategy.shouldRetry(e)) {
        // eslint-disable-next-line no-unused-vars, no-undef
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            setTimeout(() => {
                resolve(
                    this.retrier(fn, ...args)
                );
            }, this.retryConfig.strategy.timeout());
        })
      } 

      // eslint-disable-next-line no-undef
      return new Promise((_, reject) => {
        reject(new RetryError(e).exceededRetries());
      });

    })
  }

  public decoratePromise(fn: any) {
    return (...wrappedArgs: any) => {
      return this.retrier(fn, ...wrappedArgs);
    }
  }

  public static With(retyrConfig: RetryConfig) {
    return new Retry(retyrConfig);
  }
  
}