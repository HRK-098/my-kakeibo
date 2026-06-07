###############
# build stage #
###############
FROM node:22-alpine AS build
WORKDIR /app

# Copy package list
COPY ../../frontend/package.json ../../frontend/package-lock.json ./

# Install dependency
RUN npm ci --legacy-peer-deps

# Copy frontend source code
COPY ../../frontend/ .

# Run npm build
RUN npm run build

#################
# runtime stage #
###############
FROM nginx:1.28-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD [ "nginx", "-g", "daemon off;" ]

