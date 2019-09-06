FROM node:11-slim

ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=1

# Install Chromium 76, compatible with Puppeteer 1.19
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
RUN apt update
RUN apt install -y google-chrome-stable=76.* --no-install-recommends

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
