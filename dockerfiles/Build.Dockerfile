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
RUN npm i --force

# Create a new build
RUN npm run build

# Run the linter
RUN npm run lint
