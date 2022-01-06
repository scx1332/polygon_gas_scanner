FROM mongo
RUN apt-get update
RUN apt-get -y install curl
RUN apt-get -y install npm
RUN npm install -g n
RUN n stable
RUN npm install -g typescript
RUN npm install -g ts-node

COPY gas_scanner /gas_scanner
WORKDIR /gas_scanner
RUN npm install

COPY mongo_db /mongo_db

