Restaurant Management System - GROUP 1, Software Enginee

**Version:** 0.1.0  
**Technology:** Next.js 16 with React 19 & TypeScript  
**Last Updated:** February 2026  
**Status:** Production Ready

## Getting Started

production link: [https://restaurant-mangement-system-seven.vercel.app/]
Admin Access Authentication:
Email: admin.005@gmail.com
Password: Admin_5

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Restaurant Management System

## 📋 Project Overview

A comprehensive, full-stack restaurant management solution built with modern web technologies. This system digitizes restaurant operations by providing role-based interfaces for customers, waiters, kitchen staff, and administrators, featuring real-time order management and seamless communication across all user roles.

## 🏗️ Architecture & Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS with custom animations
- **Real-time Communication**: Socket.io Client
- **Authentication**: Auth0
- **State Management**: React Context API + Custom Hooks
- **Type Safety**: TypeScript
- **Testing**: Jest + React Testing Library
- **Icons**: Lucide React & Phosphor Icons

### Backend

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io Server
- **Authentication**: JWT with bcryptjs
- **Rate Limiting**: Upstash Redis
- **CORS**: Configured for cross-origin requests

### Infrastructure

- **Deployment**: Vercel (Frontend), Railway/Heroku (Backend)
- **Database Hosting**: MongoDB Atlas
- **Caching**: Upstash Redis
- **Version Control**: Git with GitHub

## 🎯 Key Features

### 👥 User Roles & Permissions

- **Customers**: Browse menu, place orders, view ratings
- **Waiters**: Take orders, manage tables, customer service
- **Kitchen Staff**: View orders, update preparation status
- **Administrators**: Full system management, analytics

### 🍽️ Menu Management

- Dynamic menu with categories and subcategories
- Dietary filtering (Vegan, Vegetarian, Gluten-free)
- Chef specials and featured items
- Price history tracking
- Inventory management

### 📊 Real-time Order Processing

- Instant order notifications across all interfaces
- Live order status updates (Pending → Preparing → Ready → Served)
- Table-based order organization
- Customer notes and special requests

### 📈 Analytics & Reporting

- Kitchen performance metrics
- Order statistics and trends
- Revenue tracking
- User activity reports

### 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting and DDoS protection
- Secure password hashing
- CORS configuration

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (Upstash or local)
- Git

### Backend Setup

```bash
cd backend_restaurant
npm install
cp .env.example .env
# Configure environment variables
npm run dev

run on port 5000

if you use the vercel deployed website
npm run dev
then
use ngrok http 5000 to open a https API server
```

### Frontend Setup

```bash
cd cd restaurant_web_app
npm install
cp .env.local.example .env.local
# Configure environment variables
npm run dev
```

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Menu Management

- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item (Admin)
- `PUT /api/menu/:id` - Update menu item (Admin)
- `DELETE /api/menu/:id` - Delete menu item (Admin)

### Order Management

- `GET /api/orders` - Get orders (filtered by role)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status

### User Management

- `GET /api/users` - Get all users (Admin)
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Admin)

## 🎬 Demo Scenario: "A Day in the Restaurant"

### Phase 1: Customer Experience (3 minutes)

1. **Menu Browsing**
   - Navigate to customer interface
   - Demonstrate filtering by dietary preferences
   - Show search functionality
   - Highlight featured items and ratings

2. **Order Placement**
   - Select items and quantities
   - Add special instructions
   - Simulate order submission

### Phase 2: Waiter Operations (3 minutes)

1. **Order Management**
   - Switch to waiter interface
   - Assign order to table
   - Add customer information
   - Submit order to kitchen

### Phase 3: Kitchen Workflow (2 minutes)

1. **Order Processing**
   - View incoming orders in real-time
   - Update preparation status
   - Filter orders by status
   - Access kitchen analytics

### Phase 4: Administrative Control (2 minutes)

1. **System Management**
   - Access admin dashboard
   - Manage menu items (CRUD operations)
   - View system analytics
   - User management

### Phase 5: Real-time Features (2 minutes)

1. **Live Updates**
   - Demonstrate simultaneous interface updates
   - Show WebSocket connections
   - Highlight performance metrics

## 🧪 Testing

### Frontend Testing

```bash
npm run test
npm run test:coverage
npm run test:watch
```

### Backend Testing

```bash
npm test
```

## 📁 Project Structure

```
restaurant_management_system/
├── backend2/
│   ├── api/                 # API route handlers
│   ├── config/             # Database and external service configs
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # Mongoose schemas
│   ├── scripts/           # Database seeding scripts
│   ├── server/            # WebSocket server setup
│   └── utils/             # Utility functions
├── frontend/
│   └── restaurant_assignment_projects/
│       ├── app/           # Next.js app router pages
│       ├── components/    # Reusable React components
│       ├── contexts/      # React Context providers
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # External library configurations
│       ├── types/         # TypeScript type definitions
│       └── utils/         # Utility functions
└── docs/                  # Documentation files
```

## 🔄 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `dev` - Development branch
- `feature/*` - Feature branches

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- Commitlint for commit message standards

### Deployment

- Frontend: Vercel with automatic deployments
- Backend: Railway/Heroku with CI/CD
- Database: MongoDB Atlas with automated backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📈 Performance Metrics

- **Frontend**: Lighthouse score > 90
- **Backend**: Response time < 200ms
- **Real-time**: WebSocket latency < 50ms
- **Database**: Query optimization with indexes

## 🔍 Monitoring & Logging

- Application logs with Winston
- Error tracking with Sentry
- Performance monitoring with New Relic
- Database monitoring with MongoDB Atlas

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check backend server is running
   - Verify CORS configuration
   - Check firewall settings

2. **Authentication Errors**
   - Verify JWT secret consistency
   - Check Auth0 configuration
   - Validate token expiration

3. **Database Connection Issues**
   - Verify MongoDB URI
   - Check network connectivity
   - Validate credentials

## 📞 Support

For support and questions:

- Create an issue on GitHub: [https://github.com/Zardd99][https://github.com/Zardd99/restaurant_mangement_system]
- Contact the development team
- Check the documentation wiki

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for modern restaurant operations**

## hidden route

"http://localhost:3000 replace with the actual domain"

- http://localhost:3000/inventory/IngredientDeductionPreview
- http://localhost:3000/inventory/IngredientStockDashboard
- http://localhost:3000/users
