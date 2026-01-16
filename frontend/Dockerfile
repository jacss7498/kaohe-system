# Build stage  
FROM node:22 AS build  
WORKDIR /src  
RUN npm install -g npm@latest  
COPY package*.json ./  
RUN npm install  
COPY . .  
RUN npm run build  
# Runtime stage  
FROM zeabur/caddy-static:latest  
COPY --from=build /src/dist /usr/share/caddy  
