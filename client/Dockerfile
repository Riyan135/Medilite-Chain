FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build step if needed, but for dev we can just run it
# For a real push, we'd use Nginx and build the dist
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
