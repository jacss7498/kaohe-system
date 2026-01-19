# Build stage  
FROM node:22 AS build  
WORKDIR /src  
RUN npm install -g npm@latest  
COPY package*.json ./  
RUN npm install  
COPY . .  
RUN npm run build  

# Runtime stage - 使用通用 Nginx 镜像
FROM nginx:alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
