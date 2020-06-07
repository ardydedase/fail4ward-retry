# fail4ward-retry

![CI](https://github.com/ardydedase/fail4ward-retry/workflows/CI/badge.svg?branch=master)

## Installation

```
npm install --save fail4ward-retry
```

## Usage

1. Set the configuration using the `RetryConfigBuilder()`.

        const maxAttempts = 5;
        const waitDuration = 1000;

        const retryConfig: RetryConfig = new RetryConfigBuilder()
                .withMaxAttempts(maxAttempts)
                .withWaitDuration(waitDuration)
                .withStrategy(UntilLimit)
                .build();


1. Decorate the function that calls your service using `Retry.decoratePromise()`.

        const retry = Retry.With(retryConfig);
        const fn = retry.decoratePromise(failingFn);

1. Call the function and retrieve the response.

        try {
                const res = await fn();
                const retryResponse = await res.json();
                console.log('retryResponse: ', retryResponse);
        } catch(e) {
                console.log(e);
        }


## Development

1. Checkout the repo:

        git clone git@github.com:ardydedase/fail4ward-retry.git

1. Install dependencies

        npm install

 
1. Run build. This will generate the compiled code with type definitions in the `dist` folder.

        npm run build

1. Formatting and linting.

        npm run lint
        npm run format

1. Run tests

        npm test

## References

- https://medium.com/better-programming/lets-look-at-the-builder-pattern-in-typescript-fb9cf202c04d
- https://medium.com/dm03514-tech-blog/sre-resiliency-retries-in-action-using-js-8e4b7e7d4526
- https://medium.com/cameron-nokes/the-30-second-guide-to-publishing-a-typescript-package-to-npm-89d93ff7bccd
