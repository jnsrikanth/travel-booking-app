FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm cache clean --force && \
    npm install
COPY backend .
EXPOSE 4000
CMD ["npm", "run", "start"]
