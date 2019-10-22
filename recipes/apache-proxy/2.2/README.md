# Plugging Prerenderer to serve a SPA behind Apache proxy

Have Apache to check decide whether to proxy request to the Prerenderer or to deliver the static SPA to the user. This decision is made based upon:

- Request user-agent (know if it is bot or not)
- Request extension (prerender if it is .html, .php, .aspx, etc)
- Request location (filter by path, e.g., don't prerender `/admin/*`)

## Contents

- One `httpd-vhosts.conf` file with the config needed for the setup to work.

## Required Apache modules

The following modules need to enabled (they are included by default in stardard Apache installations):

- `mod_rewrite`
- `mod_headers`
- `mod_proxy`

> ⚠️ You will need to change a few values of the `httpd-vhosts.conf` file (e.g. match your domain name, etc). See [its contents](https://github.com/duartealexf/seo-prerenderer/blob/master/recipes/apache-proxy/2.2/httpd-vhosts.conf) for further instructions.

## Use it with a running Prerenderer instance

Do check the recipe for creating a [Prerenderer instance](https://github.com/duartealexf/seo-prerenderer/blob/master/recipes/prerenderer-behind-proxy) and make sure this Apache setup points to it when proxying.
