export interface Strategy {
  timing: any;
  maxAttempts: number;
  current: number;
}

export class UntilLimit implements Strategy {
  timing: any;
  maxAttempts: number;
  current: number;
  constructor(timing: any, maxAttempts = 3) {
    this.timing = timing;
    this.maxAttempts = maxAttempts;
    this.current = 0;
  }

  shouldRetry() {
    const doRetry = this.current < this.maxAttempts;
    return doRetry;
  }

  timeout() {
    this.current = this.current + 1;
    const timeout = this.timing.timeout();
    return timeout;
  }

  public static New(timing: any, maxAttempts: number) {
    return new UntilLimit(timing, maxAttempts);
  }
}
