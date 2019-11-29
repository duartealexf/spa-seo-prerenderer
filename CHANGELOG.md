# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.1.1](https://github.com/duartealexf/spa-seo-prerenderer/compare/v2.1.0...v2.1.1) (2019-11-29)

## [2.1.0](https://github.com/duartealexf/spa-seo-prerenderer/compare/v2.0.1...v2.1.0) (2019-11-29)


### Features

* add puppeteerLoadEvent property for init ([14e8620](https://github.com/duartealexf/spa-seo-prerenderer/commit/14e8620))

### [2.0.1](https://github.com/duartealexf/spa-seo-prerenderer/compare/v2.0.0...v2.0.1) (2019-11-28)


### Bug Fixes

* change Puppeteer to wait for "load" event ([1f1cbad](https://github.com/duartealexf/spa-seo-prerenderer/commit/1f1cbad))

## [2.0.0](https://github.com/duartealexf/spa-seo-prerenderer/compare/v1.0.3...v2.0.0) (2019-11-25)


### ⚠ BREAKING CHANGES

* On Puppeteer errors the status coded of response used to be 400. Now it is changed
to 500 and snapshot is not saveable anymore.

### Bug Fixes

* add further checks on whether snapshot can be saved ([1682db1](https://github.com/duartealexf/spa-seo-prerenderer/commit/1682db1))
* change default error status from 400 to 500 ([1ffcb8e](https://github.com/duartealexf/spa-seo-prerenderer/commit/1ffcb8e))

### [1.0.3](https://github.com/duartealexf/spa-seo-prerenderer/compare/v1.0.2...v1.0.3) (2019-10-22)

* docs: add Apache 2.2 and 2.4 proxy recipes

### [1.0.2](https://github.com/duartealexf/spa-seo-prerenderer/compare/v1.0.0...v1.0.2) (2019-10-15)

* docs: add recipe for Nginx proxy

### [1.0.1](https://github.com/duartealexf/spa-seo-prerenderer/compare/v1.0.0...v1.0.1) (2019-10-15)

* docs: add recipe for prerenderer behind proxy

### [1.0.0](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.14...v1.0.1) (2019-10-14)

* stable release, publish as npm package

### [0.0.14](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.13...v0.0.14) (2019-10-14)

### Features

* add DB method to wait for database availability ([4eb7185](https://github.com/duartealexf/spa-seo-prerenderer/commit/4eb7185))
* add post processing of page to remove scripts and add custom status ([5cb4704](https://github.com/duartealexf/spa-seo-prerenderer/commit/5cb4704))

### [0.0.13](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.12...v0.0.13) (2019-10-07)


### Bug Fixes

* bugfixes to avoid always updating a snapshot ([54d03ca](https://github.com/duartealexf/spa-seo-prerenderer/commit/54d03ca))
* fix database connection issues ([0ac1550](https://github.com/duartealexf/spa-seo-prerenderer/commit/0ac1550))
* fixes when refreshing snapshot cache ([3f38a01](https://github.com/duartealexf/spa-seo-prerenderer/commit/3f38a01))


### Features

* add snapshots as a model to be saved in database ([9594ef8](https://github.com/duartealexf/spa-seo-prerenderer/commit/9594ef8))

### [0.0.12](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.11...v0.0.12) (2019-10-04)


### Features

* add AWS S3 config values ([a792bfd](https://github.com/duartealexf/spa-seo-prerenderer/commit/a792bfd))

### [0.0.11](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.10...v0.0.11) (2019-09-29)


### Bug Fixes

* simplified one user-agent ([ccab6ce](https://github.com/duartealexf/spa-seo-prerenderer/commit/ccab6ce))


### Features

* add apache log volume ([f5c2088](https://github.com/duartealexf/spa-seo-prerenderer/commit/f5c2088))

### [0.0.10](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.9...v0.0.10) (2019-09-21)


### Bug Fixes

* fix errors in prerenderer for node 8.3 and 9 ([76cb8cb](https://github.com/duartealexf/spa-seo-prerenderer/commit/76cb8cb))


### Features

* add prerenderer url parser and remove express dep ([e59d340](https://github.com/duartealexf/spa-seo-prerenderer/commit/e59d340))

### [0.0.9](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.8...v0.0.9) (2019-09-11)

### [0.0.8](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.7...v0.0.8) (2019-09-06)


### Features

* add CHROMIUM_PATH to .env ([d5ac379](https://github.com/duartealexf/spa-seo-prerenderer/commit/d5ac379))

### [0.0.7](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.6...v0.0.7) (2019-09-06)


### Bug Fixes

* fix build ([a647e3a](https://github.com/duartealexf/spa-seo-prerenderer/commit/a647e3a))

### [0.0.6](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.5...v0.0.6) (2019-08-31)

### [0.0.5](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.4...v0.0.5) (2019-08-30)

### [0.0.4](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.3...v0.0.4) (2019-08-30)

### [0.0.3](https://github.com/duartealexf/spa-seo-prerenderer/compare/v0.0.2...v0.0.3) (2019-08-26)

### 0.0.2 (2019-08-26)
