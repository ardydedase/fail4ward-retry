export class FixedInterval {

    intervalMS: any;
    constructor(intervalMS: any) {
        this.intervalMS = intervalMS;
    }

    timeout() {
        return this.intervalMS;
    }

    public static New(intervalMS: any) {
        return new FixedInterval(intervalMS);
    }
}