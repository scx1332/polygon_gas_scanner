FROM node

RUN npm install -g typescript
RUN npm install -g ts-node

COPY gas_scanner /gas_scanner
WORKDIR /gas_scanner
RUN npm install
RUN tsc



