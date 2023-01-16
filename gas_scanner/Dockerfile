# for convenience get full debian docker container
FROM node:19-buster

WORKDIR /scanner

# install dependencies
COPY package.json .
COPY package-lock.json .

RUN npm install

# copy source code
COPY tsconfig.json .
COPY src src
COPY *.ts .
# build source code into dist
RUN npx tsc

ENTRYPOINT node dist/gas_scanner_watchdog.js