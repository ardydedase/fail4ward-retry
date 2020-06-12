# fail4ward-retry

NPM package to implement Retry Pattern in your nodejs applications. Created from this [Cookiecutter Template](https://github.com/ardydedase/cookiecutter-npm-package).

[![CI](https://github.com/ardydedase/fail4ward-retry/workflows/CI/badge.svg?branch=master)](https://github.com/ardydedase/fail4ward-retry/actions?query=workflow%3ACI) [![npm-publish](https://github.com/ardydedase/fail4ward-retry/workflows/npm-publish/badge.svg?branch=master)](https://github.com/ardydedase/fail4ward-retry/actions?query=workflow%3Anpm-publish) [![npm-install-and-use-package](https://github.com/ardydedase/fail4ward-retry/workflows/npm-install-and-use-package/badge.svg)](https://github.com/ardydedase/fail4ward-retry/actions?query=workflow%3Anpm-install-and-use-package)

[![NPM](https://nodei.co/npm/fail4ward-retry.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/fail4ward-retry/)

## Features
- Uses the builder pattern, implementation is similar to `resilience4j`.
- Uses the [ardydedase/fail4ward](https://hub.docker.com/repository/docker/ardydedase/fail4ward) docker image to run a  service to test with.
- Uses [testcontainers-node](https://github.com/testcontainers/testcontainers-node) to test against a running docker service.
- Supports `UntilLimit` strategy. Based on the Medium article [SRE: Resiliency: Retries in Action — Availability in Exchange for Latency](https://medium.com/dm03514-tech-blog/sre-resiliency-retries-in-action-using-js-8e4b7e7d4526)

## Specs

Tested on:
- npm 6.13.4
- node v10.19.0

## Installation

```
npm install --save fail4ward-retry
```

## Usage

Import what we need.

```ts
import { RetryConfigBuilder, RetryConfig, Retry, UntilLimit } from 'fail4ward-retry';
```

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

Builder properties we are setting

- `withMaxAttempts()` number of attempts to retry.
- `withWaitDuration()` backoff time in milliseconds.
- `withStrategy()` retry strategy to use. This package currently supports `UntilLimit`.

Decorate the function that calls your service using the retryConfig instantiated with `Retry.decoratePromise()`.

```ts
const retry = Retry.With(retryConfig);
const fn = retry.decoratePromise(failingFn);
```

Below is an example of the `failingFn` calls an API. Similar functions can be found in the [/example](/example) and [/\_\_tests\_\_](/__tests__) folders.
<details>
  <summary>Click to see failingFn()</summary>

```ts
async function failingFn() {
  const url = 'http://localhost:8000/error';
  try {
    const res = await fetch(url);
    const {status} = res;
    if (status === 500) {
      throw new Error('server error');
    }
    return res;
  } catch(e) {
    throw new Error(e);
  }
}
```
</details>


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

1. Run a test service

        docker run --name fail-svc -p 8000:8000 -it ardydedase/fail4ward:latest

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

## Credits

- https://medium.com/better-programming/lets-look-at-the-builder-pattern-in-typescript-fb9cf202c04d
- https://medium.com/dm03514-tech-blog/sre-resiliency-retries-in-action-using-js-8e4b7e7d4526
- https://medium.com/cameron-nokes/the-30-second-guide-to-publishing-a-typescript-package-to-npm-89d93ff7bccd
