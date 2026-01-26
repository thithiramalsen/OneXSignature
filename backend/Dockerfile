FROM node:18-alpine

# Install Python and dependencies for rembg
RUN apk add --no-cache python3 py3-pip build-base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install rembg for background removal
RUN pip3 install rembg[gpu]==2.0.50 --break-system-packages || \
    pip3 install rembg==2.0.50 --break-system-packages

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/signatures uploads/documents uploads/signed

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
