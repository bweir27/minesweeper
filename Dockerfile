FROM node:14-stretch

# Update installation repositories to add additional mirrors for stretch
RUN echo \
       'deb ftp://ftp.us.debian.org/debian/ stretch main\n \
        deb ftp://ftp.us.debian.org/debian/ stretch-updates main\n \
        deb http://security.debian.org stretch/updates main\n' \
        > /etc/apt/sources.list

# Install common installation dependencies
RUN apt-get update && apt install -yq apt-transport-https ca-certificates wget dirmngr gnupg software-properties-common

# Set up repo for MongoDB client
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Set up repo for OpenJDK
RUN wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add -
RUN add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/

# Install required dependencies
RUN apt-get update && apt-get install -yq \
    adoptopenjdk-11-hotspot \
    dos2unix \
    git-core \
    libgconf2-4 \
    libncurses5 \
    libxml2-dev \
    libxslt-dev \
    libz-dev \
    mongodb-org-shell \
    mongodb-org-tools \
    python-pytest \
    unzip \
    xclip \
    xsel \
    xvfb

# Update NPM to latest version
RUN npm i npm@latest

# Install Heroku CLI
RUN npm install -g heroku

# Install Gulp Build Tool
RUN npm install -g gulp@3.9.1

COPY scripts/wait.sh /app/wait.sh
RUN dos2unix /app/wait.sh && chmod a+x /app/wait.sh

ENTRYPOINT ["/app/wait.sh"]
