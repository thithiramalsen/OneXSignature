FROM node:18-bullseye

# Install Python and build deps (Debian-based so rembg wheels for numba/llvmlite are available)
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		python3 python3-pip python3-dev build-essential \
		libgl1 libglib2.0-0 libjpeg-dev zlib1g-dev \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Upgrade pip (Debian ships an old pip) and install rembg (CPU) on a Python 3.9-compatible version
RUN pip3 install --upgrade pip \
	&& pip3 install rembg==2.0.61 onnxruntime==1.18.1

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/signatures uploads/documents uploads/signed

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
