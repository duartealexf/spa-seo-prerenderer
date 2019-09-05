FROM nginx AS nginx

ARG TEST_NGINX_SERVER_HOST
ENV TEST_NGINX_SERVER_HOST=$TEST_NGINX_SERVER_HOST

# Home settings
ENV HOME=/var/www
RUN rm -rf $HOME
WORKDIR $HOME

# Copy and test Nginx config
COPY ./docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s/TEST_NGINX_SERVER_HOST/${TEST_NGINX_SERVER_HOST}/g" /etc/nginx/conf.d/default.conf
RUN nginx -t
