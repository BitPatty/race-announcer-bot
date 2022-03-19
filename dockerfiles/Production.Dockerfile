FROM node:16.14.2-alpine3.14 as install

# Install build dependencies
RUN apk --no-cache add shadow \
  gcc \
  musl-dev \
  autoconf \
  automake \
  make \
  libtool \
  nasm \
  tiff \
  jpeg \
  zlib \
  zlib-dev \
  file \
  pkgconf \
  python2 \
  g++

# Make sure we have the latest npm version
RUN npm install -g npm@latest

# Copy the project over to the image
WORKDIR /app
COPY . .

# Install the dependencies
RUN npm ci

# Create a new build
RUN npm run build

# Replace dependencies with prod dependencies
RUN rm -rf node_modules
ENV NODE_ENV="production"
RUN npm ci --production

FROM node:16.14.2-alpine3.14 as final

WORKDIR /app
COPY --from=install /app/dist/src /app
COPY --from=install /app/node_modules /app/node_modules
COPY --from=install /app/LICENSE /app/LICENSE

CMD [ "node", "index.js" ]