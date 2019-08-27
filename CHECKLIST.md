# Checklist

## Basic setup

- [x] Setup repository
- [x] Create tests, work with TDD
- [ ] Simple prerenderer, save local file
- [ ] Debug
- [ ] Keep headless browser open, create new pages per request
- [ ] Filter user agents
- [ ] Filter extensions
- [ ] Blacklisting tracking scripts
- [ ] **Setup in Docker**

## Creating an use-case

- [ ] Create a multi-route use-case
- [ ] Make it public
- [ ] Add GA / GTM / plug to Google Search Console
- [ ] Take screenshots of messed up Google Result
- [ ] See how Google Pagespeed Insights behave
- [ ] Plug prerenderer

## Need-to-have

- [ ] Preserve status codes (deliver 404, 500, etc)
- [ ] Upload to S3 / make needed changes / .env setup
- [ ] See how to automatically clear prerendered pages (by commit, or something)
- [ ] Create a recipe for using it with nginx
- [ ] Create whitelist
- [ ] Create blacklist
- [ ] Extend bots list
- [ ] **Add to public NPM registry - release as 1.0.0**
- [ ] **Publish as a docker image**

## Nice-to-have

- [ ] Create a recipes folder - add examples
- [ ] Link prerenderer's clearance of cached pages to Github actions
- [ ] Debug remotely
- [ ] Add usage of server-timing API
