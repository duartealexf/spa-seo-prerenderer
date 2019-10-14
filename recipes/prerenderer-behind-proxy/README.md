# Instantiating a Prerenderer Service to be behind Apache or Nginx proxy

You can have this setup done with or without Docker. Since Apache or Nginx decides whether request should be Prerendered, all this does it prerender and send result as response.

It is a lot easier running with Docker because the Dockerfile in this recipe already install all libraries neede by Puppeteer.

- Copy `.env.example` to `.env` so that Docker reads it. Change the values in it as needed.
- `docker-compose build`
- `docker-compose up -d`

## Contents

Look at the `dist/main.js` file. Summarized, it is:

```js
const prerendererService = new PrerendererService({
  databaseOptions: {/*...*/},
});

const main = async () => {
  await prerendererService.getDatabase().waitForDatabaseAvailability();
  await prerendererService.start();

  const app = express();
  app.listen(port, '0.0.0.0');

  app.use((req, res, next) => {
    prerendererService
      .handleRequest(req)
      .then((snapshot) => {
        res
          .status(snapshot.getStatusForResponse())
          .set(snapshot.getHeadersForResponse())
          .send(snapshot.getBodyForResponse());

        snapshot.saveIfNeeded();
      })
      .catch((err) => {
        next(err);
      });
  });
};

main().then(() => console.log('App is running'));
```
