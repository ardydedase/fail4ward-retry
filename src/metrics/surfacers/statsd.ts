
export class StatsDSurfacer {
    // TODO: fix 'any' types
    metrics: any;
    client: any;
    constructor(metrics: any, client: any) {
        this.metrics = metrics;
        this.client = client;
    }

    surface() {
        this.metrics.subscribe(this.handleMetric.bind(this, this.metrics, this.client))
    }

    handleMetric(metrics: any, client: any, metric: any) {
        switch (metric.type) {
            case metrics.type.COUNTER:
                client.increment(
                    metric.component + '.' + metric.event,
                    metric.tags);
                break;
            case metrics.type.GAUGE:
                client.gauge(
                    metric.component + '.' + metric.event,
                    metric.value,
                    metric.tags);
                break;
            default:
                throw new Error('not implemented');
        }
    }
}
