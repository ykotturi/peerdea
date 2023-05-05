# setup react build
# setting up node environment
FROM node:8-alpine as client
# authors of peerdea
MAINTAINER peerdea_contributors

# Change working directory
WORKDIR .

# Install App Dependencies
COPY package*.json ./
RUN npm install

# Copy App Source
COPY . .
#TODO Run any build scripts here

#connects server.js (port 80) to docker machine
EXPOSE 80
# this triggers package.json, setting up modules
CMD [ "npm", "start" ]
