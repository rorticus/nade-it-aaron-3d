FROM node:12

# Copy the client, assuming already built
COPY client/build /app/client
ENV STATIC_PATH=/app/client

# Copy and build the server
COPY server/package.json /app/server/package.json
WORKDIR /app/server
RUN npm i
COPY server/ /app/server
COPY shared/ /app/shared
RUN npm run build

WORKDIR /app/server/build/server/src

ENV PORT=80
CMD ["/usr/local/bin/node",  "index.js"]