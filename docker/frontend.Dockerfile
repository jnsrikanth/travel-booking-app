FROM node:18-alpine

WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 3000

# Use development mode instead of build
CMD ["npm", "run", "dev"]
