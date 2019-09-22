# Checklist

## Basic setup

- [x] Setup repository
- [x] Create unit tests
- [ ] Create integration tests
- [x] Debug
- [x] Keep headless browser open, create new pages per request
- [x] Filter user agents
- [x] Filter extensions
- [x] Blacklisting tracking scripts
- [ ] Simple prerenderer, save local file
- [x] Add to docker, set tests in docker with nginx
- [x] Create a nginx proxy test
- [x] Preserve status codes (deliver 404, 500, etc)
- [x] Setup in Docker
- [x] Testing in Docker with different NodeJS versions

## Creating an use-case

- [ ] Attach it to a real website
- [ ] Make it public
- [ ] Add GA / GTM / plug to Google Search Console
- [ ] Take screenshots of messed up Google search results
- [ ] See how Google Pagespeed Insights behave
- [ ] Plug prerenderer
- [ ] Take screenshots of corrected Google search results

## Need-to-have

- [ ] Upload to S3
- [ ] See how to automatically clear prerendered pages (by commit, or something)
- [ ] Create a recipe for using it with nginx
- [ ] **Add to public NPM registry - release as 1.0.0**
- [ ] **Publish a docker image**

## Nice-to-have

- [ ] Create a recipes folder - add examples
- [ ] Link prerenderer's clearance of cached pages to Github actions
- [ ] Debug remotely
- [ ] Add usage of server-timing API
