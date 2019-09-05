FROM node:11-alpine AS app

# Home settings
ENV HOME=/var/www
WORKDIR $HOME

# NPM dependencies
COPY package* $HOME/
RUN npm i

# Copy project files
COPY . $HOME/

RUN node -v \
  && npm -v

CMD ["npm", "run", "test"];
