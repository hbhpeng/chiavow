# Chiavow Quick Start Guide

## What is Chiavow?

Chiavow is a travel companion platform that connects travelers with local guides in China. The name combines "China", "Travel", and "WOW" to create a unique brand identity.

## Features

- 🔐 Phone number authentication with SMS verification
- 👤 User profiles with custom or auto-generated avatars
- 🧭 Guide matching system with customizable trip details
- 📋 Order management (create, view, pay, cancel)
- 🌍 Multi-language support (English & Chinese)
- 📱 Mobile-first responsive design

## Quick Setup

### For Development

1. **Install dependencies:**
```bash
cd chiavow
chmod +x setup.sh
./setup.sh
```

2. **Start the backend:**
```bash
cd server
npm run dev
```

3. **Start the frontend (in a new terminal):**
```bash
cd client
npm run dev
```

4. **Open your browser:**
   - Visit: http://localhost:3000
   - Backend API: http://localhost:3001

### Testing the App

1. **Login:**
   - Enter any phone number (e.g., +86 13800138000)
   - Click "Send Code"
   - Check the server console for the verification code
   - Enter the code and login

2. **Setup Profile:**
   - Upload an avatar (optional - a random one is generated if skipped)
   - Enter your username (required)
   - Select your primary language (required)
   - Select secondary language (optional)
   - Click "Start"

3. **Create a Trip Order:**
   - Select cities from the dropdown
   - Choose start and end dates
   - Add more trips if needed (using the + button)
   - Specify number of travelers (1-5)
   - Select optional services:
     - Supply vehicles ($100/day)
     - Free itinerary recommendations
     - Tailor-made travel ($2/day)
   - Click "Match Guide"

4. **Manage Orders:**
   - View active, paid, and cancelled orders
   - Pay for active orders
   - Cancel active orders

5. **View Profile:**
   - See your user information
   - Switch app language
   - Logout

## Project Structure

```
chiavow/
├── client/                 # Vue 3 Frontend
│   ├── src/
│   │   ├── views/         # Pages (Auth, Profile Setup, Main, etc.)
│   │   ├── api/           # API services
│   │   ├── stores/        # State management (Pinia)
│   │   ├── locales/       # i18n translations (en, zh)
│   │   ├── router/        # Vue Router config
│   │   └── utils/         # Utilities (axios, etc.)
│   └── package.json
│
├── server/                # Node.js Backend
│   ├── src/
│   │   ├── routes/        # API routes (auth, user, orders)
│   │   ├── middleware/    # Auth middleware
│   │   ├── utils/         # Database, avatar generator
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── README.md              # Main documentation
├── DEPLOYMENT_CN.md       # Chinese deployment guide
├── QUICKSTART.md          # This file
├── setup.sh              # Development setup script
└── build.sh              # Production build script
```

## Key Technologies

**Frontend:**
- Vue 3 + TypeScript + Vite
- Vue Router (navigation)
- Pinia (state management)
- Vue I18n (internationalization)
- Axios (HTTP client)

**Backend:**
- Node.js + Express + TypeScript
- JWT (authentication)
- Multer (file uploads)
- Canvas (avatar generation)

## API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code and login
- `GET /api/auth/me` - Get current user

### User
- `POST /api/user/avatar` - Upload avatar
- `PUT /api/user/profile` - Update profile

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `PUT /api/orders/:id/cancel` - Cancel order
- `PUT /api/orders/:id/pay` - Pay order

## Environment Variables

**Server (.env):**
```env
PORT=3001
JWT_SECRET=your-secret-key
NODE_ENV=development
```

**Client:**
- Development: Proxies to `localhost:3001`
- Production: Configure in `vite.config.ts`

## Building for Production

```bash
chmod +x build.sh
./build.sh
```

This builds both frontend and backend for production deployment.

## Deployment

See [README.md](README.md) for detailed deployment instructions including:
- Alibaba Cloud (Aliyun) deployment
- Other cloud providers (AWS, DigitalOcean)
- Docker deployment
- Nginx configuration
- SSL setup
- Monitoring and maintenance

中文部署指南请参考 [DEPLOYMENT_CN.md](DEPLOYMENT_CN.md)

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Dependencies issues
```bash
# Clear and reinstall
cd client && rm -rf node_modules package-lock.json && npm install
cd ../server && rm -rf node_modules package-lock.json && npm install
```

### Build errors
Make sure you have:
- Node.js v16 or higher
- npm v7 or higher

## Next Steps

1. **Database Integration:** Replace in-memory storage with MongoDB/PostgreSQL
2. **SMS Service:** Integrate real SMS provider (Twilio, Alibaba Cloud SMS)
3. **Payment Gateway:** Integrate payment service (Stripe, Alipay, WeChat Pay)
4. **Guide Profiles:** Add guide management system
5. **Real-time Chat:** Add messaging between travelers and guides
6. **Reviews & Ratings:** Add review system
7. **Admin Dashboard:** Build admin panel

## Support

For issues or questions:
- Check the console for errors
- Review server logs: `cd server && npm run dev`
- Check browser developer tools
- Refer to README.md for detailed documentation

## License

MIT

---

Made with ❤️ for travelers in China
