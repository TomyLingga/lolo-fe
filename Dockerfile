# Tahap 1: Build aplikasi menggunakan Node.js
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pastikan file .env sudah ada atau ter-copy sebelum command di bawah ini jalan
RUN npm run build

# Tahap 2: Serve aplikasi menggunakan Nginx (sangat ringan)
FROM nginx:alpine
# Ganti /app/dist dengan /app/build jika kamu pakai Create React App biasa
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
