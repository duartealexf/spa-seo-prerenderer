# Roadmap

- [x] Add to docker, set tests in Docker
- [x] Create unit tests
- [x] Create integration tests: http NodeJS requests
- [x] Create integration tests: behind Nginx proxy
- [x] Create integration tests: behind Apache proxy
- [x] Create integration tests: https NodeJS requests
- [x] Keep headless browser open, create new pages per request
- [x] Filter user agents
- [x] Filter extensions
- [x] Blacklisting tracking scripts
- [x] Preserve status codes (deliver 404, 500, etc)
- [x] IPV6 URL parsing
- [x] Check database that it has non-expired cache
  - [x] Deliver cache if it does
  - [x] Otherwise prerender and generate response
    - [x] Update database
    - [x] Make sure that response reaches before updating database
- [ ] Lower the cache age for error pages - tag them with error
- [ ] Add collection index on url.
- [ ] Set to automatically invalidate prerendered pages using tags (create an API for this)
- [ ] Create recipes for Prerenderer's clearance of cached pages via Github Actions
- [ ] HTTP 2.0
- [ ] Add recipe to use with server-timing API
- [ ] Automatically recache old cache
- [ ] Create a dashboard

## Notes to self - creating an use-case

- [ ] Attach it to a real website
- [ ] Make it public
- [ ] Add GA / GTM / plug to Google Search Console
- [ ] Take screenshots of messed up Google search results
- [ ] See how Google Pagespeed Insights behave
- [ ] Plug prerenderer
- [ ] Take screenshots of corrected Google search results
