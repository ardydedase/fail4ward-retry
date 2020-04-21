/* eslint-disable no-unused-vars */
import { Subject } from 'rxjs';
import { StatsDSurfacer } from './surfacers/statsd';
import { Prometheus } from './surfacers/prometheus';

// TODO: fix 'any' types
const MetricType = Object.freeze({
    COUNTER: 'counter',
    GAUGE: 'gauge',
    HISTOGRAM: 'histogram',
});

export class Metrics {
    observable: Subject<any>;
    type: any;
    constructor() {
        this.observable = new Subject();
        this.type = MetricType;
    }

    emit(metric: any) {
        this.observable.next(metric);
    }

    subscribe(fn: any) {
        return this.observable.subscribe(fn);
    }

    public static New() {
        return new Metrics();
    }
}

export interface Surfacers {
    StatsD: StatsDSurfacer,
    Prometheus: Prometheus,
}
