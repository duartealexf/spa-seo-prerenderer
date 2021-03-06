FROM httpd:2.4

ARG TEST_SMART_APACHE_CONTAINER_HOST
ARG TEST_COMMON_APACHE_CONTAINER_HOST
ARG TEST_PRERENDERER_NODEJS_SERVER_PORT
ARG TEST_STATIC_NODEJS_SERVER_PORT
ARG TEST_APP_NODEJS_SERVER_PORT

ENV TEST_SMART_APACHE_CONTAINER_HOST=$TEST_SMART_APACHE_CONTAINER_HOST
ENV TEST_COMMON_APACHE_CONTAINER_HOST=$TEST_COMMON_APACHE_CONTAINER_HOST
ENV TEST_PRERENDERER_NODEJS_SERVER_PORT=$TEST_PRERENDERER_NODEJS_SERVER_PORT
ENV TEST_STATIC_NODEJS_SERVER_PORT=$TEST_STATIC_NODEJS_SERVER_PORT
ENV TEST_APP_NODEJS_SERVER_PORT=$TEST_APP_NODEJS_SERVER_PORT

# Home settings
ENV HOME=/usr/local/apache2/htdocs/
RUN rm -rf $HOME
WORKDIR $HOME

# Copy and test Apache config

COPY ./docker/apache/2.4/httpd.conf /usr/local/apache2/conf/httpd.conf
COPY ./docker/apache/2.4/httpd-vhosts.conf /usr/local/apache2/conf/extra/httpd-vhosts.conf

RUN sed -i "s/TEST_SMART_APACHE_CONTAINER_HOST/${TEST_SMART_APACHE_CONTAINER_HOST}/g" /usr/local/apache2/conf/extra/httpd-vhosts.conf
RUN sed -i "s/TEST_COMMON_APACHE_CONTAINER_HOST/${TEST_COMMON_APACHE_CONTAINER_HOST}/g" /usr/local/apache2/conf/extra/httpd-vhosts.conf

RUN sed -i "s/TEST_PRERENDERER_NODEJS_SERVER_PORT/${TEST_PRERENDERER_NODEJS_SERVER_PORT}/g" /usr/local/apache2/conf/extra/httpd-vhosts.conf
RUN sed -i "s/TEST_STATIC_NODEJS_SERVER_PORT/${TEST_STATIC_NODEJS_SERVER_PORT}/g" /usr/local/apache2/conf/extra/httpd-vhosts.conf
RUN sed -i "s/TEST_APP_NODEJS_SERVER_PORT/${TEST_APP_NODEJS_SERVER_PORT}/g" /usr/local/apache2/conf/extra/httpd-vhosts.conf

RUN apachectl -t
RUN apachectl -v
