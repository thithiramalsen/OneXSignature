# Deployment Guide

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed on the server
- Domain name (optional, for HTTPS)
- SSL certificate (optional, for HTTPS)

### Environment Setup

1. Create a `.env` file in the root directory:

```bash
# Database
DB_NAME=onex_signature
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRE=7d

# API URL (update with your domain)
API_URL=https://api.yourdomain.com/api
```

2. Update the `.env` file with secure values:
   - Generate a strong database password
   - Generate a secure JWT secret (at least 32 characters)
   - Update API_URL with your actual domain

### Docker Production Deployment

1. Clone the repository on your server:

```bash
git clone https://github.com/thithiramalsen/OneXSignature.git
cd OneXSignature
```

2. Create the `.env` file with production credentials

3. Build and start the containers:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. Check the logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Nginx Configuration (Optional)

If you want to use Nginx as a reverse proxy with SSL:

1. Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Uploads
        location /uploads {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

2. Place SSL certificates in `nginx/ssl/`

### Database Backup

Create regular backups of your PostgreSQL database:

```bash
# Backup
docker exec onex-signature-db-prod pg_dump -U postgres onex_signature > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20240101.sql | docker exec -i onex-signature-db-prod psql -U postgres onex_signature
```

### Monitoring

Monitor your containers:

```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Updating the Application

1. Pull the latest changes:

```bash
git pull origin main
```

2. Rebuild and restart containers:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Security Checklist

- [ ] Use strong database passwords
- [ ] Use a secure JWT secret
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep Docker images updated
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting (implement in production)
- [ ] Configure CORS properly

### Scaling

For high traffic, consider:

- Using a managed PostgreSQL service (AWS RDS, Google Cloud SQL)
- Implementing Redis for session management
- Using a CDN for static assets
- Load balancing multiple backend instances
- Implementing caching strategies

## Cloud Deployment

### AWS

1. Use AWS ECS/EKS for container orchestration
2. Use AWS RDS for PostgreSQL
3. Use AWS S3 for file storage
4. Use AWS CloudFront as CDN
5. Use AWS Certificate Manager for SSL

### Google Cloud

1. Use Google Kubernetes Engine
2. Use Cloud SQL for PostgreSQL
3. Use Cloud Storage for files
4. Use Cloud CDN
5. Use Google-managed SSL certificates

### Azure

1. Use Azure Container Instances
2. Use Azure Database for PostgreSQL
3. Use Azure Blob Storage
4. Use Azure CDN
5. Use Azure App Service certificates

## Support

For deployment issues, please open an issue on GitHub.
