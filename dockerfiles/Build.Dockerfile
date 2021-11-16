FROM node:lts-alpine as install

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

# Run the linter
RUN npm run lint
