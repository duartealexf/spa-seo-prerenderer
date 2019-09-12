FROM node:8.3-slim

ENV HOME=/var/www
RUN mkdir -p $HOME

#RUN groupadd -r pptruser
#RUN useradd --home $HOME -r -g pptruser -G audio,video pptruser
#RUN mkdir -p /home/pptruser/Downloads
#RUN chown -R pptruser:pptruser /var/www

#USER pptruser
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
