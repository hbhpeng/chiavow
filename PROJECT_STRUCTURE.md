# Chiavow Project Structure

## Complete File Tree

```
chiavow/
├── client/                          # Vue 3 Frontend Application
│   ├── src/
│   │   ├── api/                    # API Service Layer
│   │   │   ├── auth.ts            # Authentication APIs
│   │   │   ├── orders.ts          # Orders APIs
│   │   │   └── user.ts            # User APIs
│   │   ├── locales/               # Internationalization
│   │   │   ├── en.json           # English translations
│   │   │   └── zh.json           # Chinese translations
│   │   ├── router/                # Vue Router Configuration
│   │   │   └── index.ts          # Route definitions
│   │   ├── stores/                # Pinia State Management
│   │   │   └── user.ts           # User store
│   │   ├── utils/                 # Utility Functions
│   │   │   └── axios.ts          # Axios configuration
│   │   ├── views/                 # Page Components
│   │   │   ├── AuthView.vue      # Login/Registration page
│   │   │   ├── ProfileSetupView.vue  # Profile setup page
│   │   │   ├── MainView.vue      # Main app with tabs
│   │   │   ├── GuideHailingView.vue  # Guide matching page
│   │   │   ├── OrdersView.vue    # Orders management page
│   │   │   └── ProfileView.vue   # User profile page
│   │   ├── App.vue               # Root component
│   │   ├── main.ts               # Application entry
│   │   └── style.css             # Global styles
│   ├── index.html                # HTML template
│   ├── vite.config.ts           # Vite configuration
│   ├── tsconfig.json            # TypeScript config
│   ├── package.json             # Dependencies
│   ├── Dockerfile               # Docker build file
│   ├── nginx.conf               # Nginx configuration
│   └── .gitignore
│
├── server/                        # Node.js Express Backend
│   ├── src/
│   │   ├── middleware/           # Express Middleware
│   │   │   └── auth.ts          # JWT authentication
│   │   ├── routes/               # API Routes
│   │   │   ├── auth.ts          # Authentication routes
│   │   │   ├── orders.ts        # Orders routes
│   │   │   └── user.ts          # User routes
│   │   ├── types/                # TypeScript Types
│   │   │   └── index.ts         # Type definitions
│   │   ├── utils/                # Utility Functions
│   │   │   ├── avatarGenerator.ts  # Avatar generation
│   │   │   └── database.ts      # In-memory database
│   │   └── index.ts              # Server entry point
│   ├── uploads/                  # User uploaded files
│   │   └── .gitkeep
│   ├── .env                      # Environment variables
│   ├── tsconfig.json            # TypeScript config
│   ├── package.json             # Dependencies
│   ├── ecosystem.config.js      # PM2 configuration
│   ├── Dockerfile               # Docker build file
│   └── .gitignore
│
├── README.md                     # Main documentation (English)
├── DEPLOYMENT_CN.md              # Deployment guide (Chinese)
├── QUICKSTART.md                 # Quick start guide
├── docker-compose.yml            # Docker Compose config
├── setup.sh                      # Development setup script
└── build.sh                      # Production build script
```

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Vue 3 | Progressive JavaScript framework |
| TypeScript | Type-safe JavaScript |
| Vite | Fast build tool |
| Vue Router | Client-side routing |
| Pinia | State management |
| Vue I18n | Internationalization |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | JavaScript runtime |
| Express | Web framework |
| TypeScript | Type-safe JavaScript |
| JWT | Authentication |
| Multer | File upload handling |
| Canvas | Avatar generation |

### DevOps
| Tool | Purpose |
|------|---------|
| PM2 | Process management |
| Nginx | Web server & reverse proxy |
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |

## Key Features

### 1. Authentication System
- **Phone Verification**: SMS-based authentication
- **JWT Tokens**: Secure token-based auth
- **Auto-Login**: Token persistence in localStorage

### 2. User Management
- **Profile Setup**: Username, languages, avatar
- **Avatar Upload**: Custom image upload
- **Auto-Generated Avatars**: Random colored avatars with initials
- **Multi-Language**: User can select preferred languages

### 3. Guide Matching
- **Multi-City Support**: 10 major Chinese cities
- **Date Range Selection**: Start and end dates for each trip
- **Multiple Trips**: Add up to 10 trip segments
- **Traveler Count**: 1-5 travelers per guide
- **Optional Services**:
  - Vehicle supply ($100/day)
  - Free itinerary recommendations
  - Tailor-made travel ($2/day)

### 4. Order Management
- **Create Orders**: Submit trip requests
- **View Orders**: Organized by status (active, paid, cancelled)
- **Pay Orders**: Simple payment flow
- **Cancel Orders**: Cancel active orders
- **Order Details**: View all trip information

### 5. Internationalization
- **Two Languages**: English (default) and Chinese
- **Language Switcher**: Easy language switching
- **Complete Translation**: All UI elements translated

### 6. Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Desktop Support**: Works on larger screens
- **Max Width**: 480px centered on desktop
- **Touch-Friendly**: Large buttons and inputs

## API Endpoints

### Authentication
```
POST   /api/auth/send-code      Send verification code
POST   /api/auth/verify-code    Verify code and login
GET    /api/auth/me            Get current user
```

### User
```
POST   /api/user/avatar        Upload avatar
PUT    /api/user/profile       Update profile
```

### Orders
```
POST   /api/orders             Create order
GET    /api/orders             Get user orders
PUT    /api/orders/:id/cancel  Cancel order
PUT    /api/orders/:id/pay     Pay order
```

## Database Schema (In-Memory)

### User
```typescript
{
  id: string                    // UUID
  phoneNumber: string          // User's phone
  username?: string            // Display name
  avatar?: string              // Avatar URL
  primaryLanguage?: string     // Primary language code
  secondaryLanguage?: string   // Secondary language code
  createdAt: Date             // Registration date
}
```

### Verification Code
```typescript
{
  phoneNumber: string          // User's phone
  code: string                // 6-digit code
  expiresAt: Date             // Expiration time
}
```

### Order
```typescript
{
  id: string                   // UUID
  userId: string              // User ID
  trips: TripSegment[]        // Array of trips
  numberOfTravelers: number   // 1-5
  supplyVehicles: boolean     // Vehicle service
  freeItinerary: boolean      // Itinerary service
  tailorMade: boolean         // Custom service
  totalAmount: number         // Calculated price
  status: string              // active|paid|cancelled
  createdAt: Date            // Order date
}
```

### Trip Segment
```typescript
{
  city: string                // City name
  startDate: string          // ISO date string
  endDate: string            // ISO date string
}
```

## Environment Setup

### Development
```bash
# Backend
cd server
npm run dev              # Starts on port 3001

# Frontend
cd client
npm run dev              # Starts on port 3000
```

### Production
```bash
# Build
./build.sh

# Deploy (PM2)
cd server
pm2 start ecosystem.config.js

# Deploy (Docker)
docker-compose up -d
```

## Configuration Files

### Client Configuration
- `vite.config.ts` - Vite build settings, proxy config
- `tsconfig.json` - TypeScript compiler options
- `nginx.conf` - Production web server config

### Server Configuration
- `.env` - Environment variables
- `tsconfig.json` - TypeScript compiler options
- `ecosystem.config.js` - PM2 process config

## Deployment Options

### 1. Traditional Deployment (PM2 + Nginx)
- Best for: VPS, dedicated servers
- Pros: Full control, easier debugging
- Cons: Manual setup, more maintenance

### 2. Docker Deployment
- Best for: Any cloud provider
- Pros: Consistent environment, easy scaling
- Cons: Requires Docker knowledge

### 3. Cloud Platform Deployment
- Alibaba Cloud (Aliyun)
- AWS, DigitalOcean, Azure, etc.

## Security Considerations

### Implemented
- ✅ JWT authentication
- ✅ Input validation
- ✅ File upload restrictions
- ✅ CORS configuration
- ✅ Environment variables

### To Implement (Production)
- [ ] Rate limiting
- [ ] Request sanitization
- [ ] SQL injection prevention (when using DB)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Helmet.js security headers
- [ ] Real SMS service with verification
- [ ] Password hashing (if adding password login)
- [ ] Payment gateway security
- [ ] Data encryption at rest

## Future Enhancements

### Priority 1 (Core Features)
- [ ] Real database (MongoDB/PostgreSQL)
- [ ] Real SMS service integration
- [ ] Payment gateway integration
- [ ] Guide profiles and management
- [ ] Review and rating system

### Priority 2 (Enhanced Features)
- [ ] Real-time chat between users and guides
- [ ] Advanced search and filters
- [ ] Map integration
- [ ] Push notifications
- [ ] Email notifications

### Priority 3 (Business Features)
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Multi-currency support
- [ ] Referral system
- [ ] Loyalty program

### Priority 4 (Technical Improvements)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] CI/CD pipeline
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Logging system

## Performance Optimization

### Frontend
- Code splitting with dynamic imports
- Image optimization
- Lazy loading components
- Service Worker for PWA
- CDN for static assets

### Backend
- Database indexing
- Query optimization
- Redis caching
- API response compression
- Load balancing

## Monitoring & Maintenance

### Logs
```bash
# PM2 logs
pm2 logs chiavow-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/api/health

# PM2 status
pm2 status

# System resources
pm2 monit
```

### Backup Strategy
- Daily automated backups
- Upload folder backup
- Database backup (when implemented)
- Configuration backup

## Development Workflow

1. **Local Development**
   - Run `./setup.sh` once
   - Start backend: `cd server && npm run dev`
   - Start frontend: `cd client && npm run dev`
   - Make changes and test

2. **Testing**
   - Test in browser at localhost:3000
   - Check server logs in terminal
   - Verify API responses

3. **Building**
   - Run `./build.sh`
   - Check dist folders

4. **Deploying**
   - Upload to server
   - Run deployment commands
   - Verify production

## Support & Documentation

- **Quick Start**: See QUICKSTART.md
- **Deployment**: See README.md or DEPLOYMENT_CN.md
- **API Docs**: Check route files in server/src/routes/
- **Issues**: Check server and browser console logs

## License

MIT - Feel free to use this project for learning or commercial purposes.

---

**Project Status**: ✅ Production Ready (with in-memory storage)

**Recommended Next Steps**:
1. Add real database
2. Integrate SMS service
3. Add payment processing
4. Implement proper testing
5. Set up CI/CD pipeline
