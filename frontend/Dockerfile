# Sử dụng một image cơ bản có sẵn Node.js
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]