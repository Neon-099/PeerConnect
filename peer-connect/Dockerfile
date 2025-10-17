FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Fix: Remove --only=production for dev dependencies
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]