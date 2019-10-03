# Checklist

## Basic setup

- [x] Setup repository
- [x] Create unit tests
- [x] Create integration tests: http NodeJS requests
- [x] Create integration tests: https NodeJS requests
- [x] Create integration tests: Nginx requests
- [x] Create integration tests: Apache requests
- [x] Debug
- [x] Keep headless browser open, create new pages per request
- [x] Filter user agents
- [x] Filter extensions
- [x] Blacklisting tracking scripts
- [ ] Simple prerenderer, save local file
- [ ] Upload to s3 after sending response
- [ ] Database integration
- [x] Add to docker, set tests in docker with nginx
- [x] Create a nginx proxy test
- [x] Preserve status codes (deliver 404, 500, etc)
- [x] Setup in Docker
- [x] Testing in Docker with different NodeJS versions

## E2E testing

- [ ] Check database that it has non-expired cache
  - [ ] Deliver cache if it does
  - [ ] Otherwise prerender and generate response
    - [ ] Update database
    - [ ] Send to s3 / localfile
    - [ ] Make sure that response reaches before anything else
      - [ ] If it does, ok
      - [ ] If it does not, store in memory
        - [ ] Queue it in memory
        - [ ] Send it to s3
        - [ ] Update database

## Creating an use-case

- [ ] Attach it to a real website
- [ ] Make it public
- [ ] Add GA / GTM / plug to Google Search Console
- [ ] Take screenshots of messed up Google search results
- [ ] See how Google Pagespeed Insights behave
- [ ] Plug prerenderer
- [ ] Take screenshots of corrected Google search results

## Need-to-have

- [ ] Set a ttl of cached files
- [ ] See how to automatically clear prerendered pages (by commit, or something)
- [ ] Create recipes for using it with nginx, apache and as an express middleware
- [ ] **Add to public NPM registry - release as 1.0.0**
- [ ] **Publish a docker image**

## Nice-to-have

- [ ] Link prerenderer's clearance of cached pages to Github actions
- [ ] Debug remotely
- [ ] Add usage of server-timing API
