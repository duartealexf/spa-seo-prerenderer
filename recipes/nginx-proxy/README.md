# Plugging Prerenderer to serve a SPA behing Nginx proxy

Have Nginx to check decide whether to proxy request to the Prerenderer or to deliver the static SPA to the user. This decision is made based upon:

- Request [user-agent](https://github.com/duartealexf/seo-prerenderer/blob/master/recipes/nginx-proxy/maps/bots.map) (know if it is bot or not)
- Request [extension](https://github.com/duartealexf/seo-prerenderer/blob/master/recipes/nginx-proxy/maps/extensions.map) (prerender if it is .html, .php, .aspx, etc)
- Request location (filter by path, e.g., don't prerender `/admin/*`)

## Contents

- One `default.conf` file with the config needed for the setup to work.
- One `maps` directory with files that are imported by `default.conf`.

> ⚠️ You will need to change a few values of the `default.conf` file (e.g. match your domain name, etc). See [its contents](https://github.com/duartealexf/seo-prerenderer/blob/master/recipes/nginx-proxy/default.conf) for further instructions.

## Use it with a running Prerenderer instance

Do check the recipe for creating a [Prerenderer instance](https://github.com/duartealexf/seo-prerenderer/blob/master/recipes/prerenderer-behind-proxy) and make sure this Nginx setup points to it when proxying.
