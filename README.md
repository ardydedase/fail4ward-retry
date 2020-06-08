# fail4ward-retry

NPM package to implement Retry Pattern in your node applications. Created from this cookiecutter template: https://github.com/ardydedase/cookiecutter-npm-package

![CI](https://github.com/ardydedase/fail4ward-retry/workflows/CI/badge.svg?branch=master)

![npm-publish](https://github.com/ardydedase/fail4ward-retry/workflows/npm-publish/badge.svg?branch=master)

[![NPM](https://nodei.co/npm/fail4ward-retry.png)](https://nodei.co/npm/fail4ward-retry/)

## Specs

Tested on:
- npm 6.13.4
- node v10.19.0

## Installation

```
npm install --save fail4ward-retry
```

## Usage

Set the configuration using the `RetryConfigBuilder()`.

```ts
const maxAttempts = 5;
const waitDuration = 1000;

const retryConfig: RetryConfig = new RetryConfigBuilder()
        .withMaxAttempts(maxAttempts)
        .withWaitDuration(waitDuration)
        .withStrategy(UntilLimit)
        .build();
```

Decorate the function that calls your service using `Retry.decoratePromise()`.

```ts
const retry = Retry.With(retryConfig);
const fn = retry.decoratePromise(failingFn);
```

Call the function that fetches the response from your API and retrieve the response.

```ts
try {
        const res = await fn();
        const retryResponse = await res.json();
        console.log('retryResponse: ', retryResponse);
} catch(e) {
        console.log(e);
}
```

## Run the example

1. Checkout the repo

        git clone git@github.com:ardydedase/fail4ward-retry.git

1. Change directory to the `example` folder

        cd example/

1. Install dependencies

        npm install

1. Run the example file

        npm run dev

## Development

1. Checkout the repo
        

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
