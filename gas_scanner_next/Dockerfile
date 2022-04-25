FROM node:lts as dependencies
WORKDIR /gas-scanner-next
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:lts as builder
WORKDIR /gas-scanner-next
COPY . .
COPY --from=dependencies /gas-scanner-next/node_modules ./node_modules
RUN yarn build

FROM node:lts as runner
WORKDIR /gas-scanner-next
ENV NODE_ENV production
# If you are using a custom next.config.js file, uncomment this line.
COPY --from=builder /gas-scanner-next/next.config.js ./
COPY --from=builder /gas-scanner-next/public ./public
COPY --from=builder /gas-scanner-next/.next ./.next
COPY --from=builder /gas-scanner-next/node_modules ./node_modules
COPY --from=builder /gas-scanner-next/package.json ./package.json

EXPOSE 3000
CMD ["yarn", "start"]