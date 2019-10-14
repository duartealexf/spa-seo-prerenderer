# Instantiating a Prerenderer Service to be behind Apache or Nginx proxy

You can have this setup done with or without Docker. Since Apache or Nginx decides whether request should be Prerendered, all this does it prerender and send result as response.

It is a lot easier running with Docker because the Dockerfile in this recipe already install all libraries neede by Puppeteer.

- Copy `.env.example` to `.env` so that Docker reads it. Change the values in it as needed.
- `docker-compose build`
- `docker-compose up -d`
