# Checklist

## Basic setup

- [x] Setup repository
- [x] Create unit tests
- [x] Create integration tests: http NodeJS requests
- [x] Create integration tests: Nginx requests
- [x] Debug
- [x] Keep headless browser open, create new pages per request
- [x] Filter user agents
- [x] Filter extensions
- [x] Blacklisting tracking scripts
- [x] Save to database after sending response
- [x] Add to docker, set tests in docker with nginx
- [x] Create a nginx proxy test
- [x] Preserve status codes (deliver 404, 500, etc)
- [x] Setup in Docker
- [x] Testing in Docker with different NodeJS versions
- [x] Testing with IPV6

## E2E testing

- [x] Check database that it has non-expired cache
  - [x] Deliver cache if it does
  - [x] Otherwise prerender and generate response
    - [x] Update database
    - [x] Make sure that response reaches before updating database

## Creating an use-case

- [ ] Attach it to a real website
- [ ] Make it public
- [ ] Add GA / GTM / plug to Google Search Console
- [ ] Take screenshots of messed up Google search results
- [ ] See how Google Pagespeed Insights behave
- [ ] Plug prerenderer
- [ ] Take screenshots of corrected Google search results

## Need-to-have

- [ ] Test with HTTP 2.0
- [ ] See how to automatically clear prerendered pages using tags
- [ ] Create recipes for using it with nginx, apache and as an express middleware
- [ ] **Add to public NPM registry - release as 1.0.0**

## Nice-to-have

- [x] Create integration tests: https NodeJS requests
- [x] Create integration tests: Apache requests
- [ ] Link prerenderer's clearance of cached pages to Github actions using tags
- [ ] Debug remotely
- [ ] Add usage of server-timing API
