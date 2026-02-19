FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Use legacy-peer-deps to avoid peer dependency resolution failures
# (react-scripts@5 has peer requirements incompatible with TypeScript 5+)
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
