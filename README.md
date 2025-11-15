# Chiavow - China Travel Platform

Chiavow is a travel companion platform connecting travelers with local guides in China.

## Project Structure

```
chiavow/
├── client/          # Vue 3 frontend application
│   ├── src/
│   │   ├── views/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── stores/      # Pinia state management
│   │   ├── api/         # API service layer
│   │   ├── locales/     # i18n translations
│   │   └── utils/       # Utility functions
│   └── package.json
├── server/          # Node.js Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Express middleware
│   │   ├── utils/       # Utility functions
│   │   └── types/       # TypeScript types
│   └── package.json
└── README.md
```

## Features

- 📱 Mobile-first responsive design
- 🌍 Multi-language support (English, Chinese)
- 📞 Phone verification authentication
- 👤 User profile management with avatar upload
- 🧭 Guide matching system
- 📋 Order management (create, view, cancel, pay)
- 🎨 Random avatar generation

## Tech Stack

### Frontend
- Vue 3 + TypeScript
- Vue Router
- Pinia (state management)
- Vue I18n (internationalization)
- Vite (build tool)
- Axios (HTTP client)

### Backend
- Node.js + Express
- TypeScript
- JWT authentication
- Multer (file uploads)
- Canvas (avatar generation)

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd chiavow
```

2. Install client dependencies:
```bash
cd client
npm install
```

3. Install server dependencies:
```bash
cd ../server
npm install
```

### Running in Development

1. Start the backend server:
```bash
cd server
npm run dev
```
Server will run on `http://localhost:3001`

2. In a new terminal, start the frontend:
```bash
cd client
npm run dev
```
Client will run on `http://localhost:3000`

3. Open your browser and navigate to `http://localhost:3000`

## Building for Production

### Build Client
```bash
cd client
npm run build
```
This creates a `dist` folder with production-ready files.

### Build Server
```bash
cd server
npm run build
```
This creates a `dist` folder with compiled JavaScript.

## Deployment Guide

### Option 1: Alibaba Cloud (Aliyun)

#### Prerequisites
- An Alibaba Cloud account
- An ECS (Elastic Compute Service) instance
- A domain name (optional but recommended)

#### Steps:

1. **Purchase and Configure ECS Instance**
   - Go to Alibaba Cloud Console
   - Purchase an ECS instance (Ubuntu 20.04 LTS recommended)
   - Security Group: Open ports 80, 443, 3000, 3001
   - Get the public IP address

2. **Connect to Your Server**
```bash
ssh root@your-server-ip
```

3. **Install Node.js and PM2**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install nginx
sudo apt install -y nginx
```

4. **Upload Your Code**
```bash
# On your local machine
cd chiavow
tar -czf chiavow.tar.gz client server

# Upload to server
scp chiavow.tar.gz root@your-server-ip:/root/

# On server
cd /root
tar -xzf chiavow.tar.gz
```

5. **Setup Backend**
```bash
cd /root/chiavow/server
npm install
npm run build

# Create production .env file
cat > .env << EOF
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# Start with PM2
pm2 start dist/index.js --name chiavow-api
pm2 save
pm2 startup
```

6. **Setup Frontend**
```bash
cd /root/chiavow/client

# Update API URL for production
# Edit vite.config.ts to use your domain or IP

npm install
npm run build
```

7. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/chiavow
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your IP address

    # Frontend
    location / {
        root /root/chiavow/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/chiavow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Setup SSL (Optional but Recommended)**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

9. **Setup Firewall**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Option 2: Other Cloud Providers (AWS, DigitalOcean, etc.)

The deployment process is similar:

1. **Create a VPS/Instance**
   - Choose Ubuntu 20.04 LTS
   - Open ports 80, 443
   - Get public IP or domain

2. **Follow steps 2-9 from Alibaba Cloud guide above**

### Option 3: Docker Deployment

1. **Create Dockerfile for Server**
```bash
cd server
cat > Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
EOF
```

2. **Create Dockerfile for Client**
```bash
cd ../client
cat > Dockerfile << EOF
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
```

3. **Create docker-compose.yml**
```bash
cd ..
cat > docker-compose.yml << EOF
version: '3.8'

services:
  api:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  web:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped
EOF
```

4. **Deploy**
```bash
docker-compose up -d
```

## Environment Variables

### Server (.env)
```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### Client
Configure in `vite.config.ts`:
- Development: Uses proxy to `localhost:3001`
- Production: Update API URL to your domain

## Monitoring and Maintenance

### Check PM2 Status
```bash
pm2 status
pm2 logs chiavow-api
```

### Restart Services
```bash
pm2 restart chiavow-api
sudo systemctl restart nginx
```

### Update Application
```bash
# Upload new code
cd /root/chiavow/server
npm run build
pm2 restart chiavow-api

cd /root/chiavow/client
npm run build
```

## Default Test Account

For development/testing, the verification code is logged to the server console.

Phone: Any valid phone number
Code: Check server logs after clicking "Send Code"

## Security Notes

1. Change JWT_SECRET in production
2. Use HTTPS in production
3. Implement rate limiting for API endpoints
4. Add proper validation and sanitization
5. Use a real SMS service for verification codes
6. Implement proper database (MongoDB, PostgreSQL) instead of in-memory storage
7. Add proper error logging and monitoring
8. Implement backup strategy

## Future Improvements

- [ ] Real database integration (MongoDB/PostgreSQL)
- [ ] Real SMS service integration
- [ ] Payment gateway integration
- [ ] Real-time chat between travelers and guides
- [ ] Guide profiles and ratings
- [ ] Advanced search and filtering
- [ ] Push notifications
- [ ] Admin dashboard

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
