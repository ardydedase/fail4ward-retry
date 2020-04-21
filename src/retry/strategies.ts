/* eslint-disable no-undef */
// const ms = require('../metrics/metrics.js');
import { Metrics } from '../metrics/metrics';


export class UntilLimit {
    timing: any;
    maxAttempts: number;
    current: number;
    metrics: any;
    constructor(timing: any, maxAttempts=3, metrics=null) {
        this.timing = timing;
        this.maxAttempts = maxAttempts;
        this.current = 0;
        this.metrics = metrics || Metrics.New();
    }

    // eslint-disable-next-line no-unused-vars
    shouldRetry(_err: any) {
        const doRetry = this.current < this.maxAttempts;
        this.metrics.emit({
            event: 'shouldretry',
            tags: {
                strategy: 'untillimit',
                doretry:  doRetry,
            },
            value: 1,
            type: this.metrics.type.COUNTER,
            component: 'retry',
        });
        return doRetry;
    }

    timeout() {
        this.current = this.current + 1;
        const timeout = this.timing.timeout();
        // this.metrics.emit({
        //     event: 'attempt',
        //     tags: {
        //         strategy: 'untillimit',
        //         number: this.current,
        //     },
        //     value: 1,
        //     type: this.metrics.type.COUNTER,
        //     component: 'retry'
        // });
        return timeout;
    }

    public static New(timing: any, maxAttempts: number, metrics: any = null) {
        return new UntilLimit(
            timing,
            maxAttempts,
            metrics,
        );
    }
}
