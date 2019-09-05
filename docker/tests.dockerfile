FROM node:11-alpine AS app

# Home settings
ENV HOME=/var/www
WORKDIR $HOME

RUN node -v \
  && npm -v

# NPM dependencies
COPY package* $HOME/
RUN npm i

# Copy project files
COPY . $HOME/

RUN npm run build

CMD ["npm", "run", "test"];
