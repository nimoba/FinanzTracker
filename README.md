# FinanceFlow

A personal finance tracking web application with password-protected access, built with React, TypeScript, Node.js, Express, and PostgreSQL.

## Features

### Core Features
- **Password-protected access** - Simple cookie-based authentication
- **Dashboard** - Overview of financial metrics and recent transactions
- **Account Management** - Track multiple accounts (checking, savings, credit, etc.)
- **Transaction Tracking** - Record income, expenses, and transfers
- **Categories** - Organize transactions with customizable categories
- **Budgets** - Set and track budgets by category
- **Goals** - Set financial goals and track progress
- **Analytics** - Visual charts and spending insights

### Technical Features
- Modern React frontend with TypeScript
- Express.js backend with PostgreSQL database
- Tailwind CSS for styling
- Chart.js for data visualization
- Zustand for state management
- Docker containerization
- Responsive design

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS
- Chart.js & react-chartjs-2
- React Router DOM
- React Hook Form
- Zustand (state management)
- Lucide React (icons)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with pg driver
- JWT authentication support
- Helmet (security)
- CORS
- Morgan (logging)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL database

## Project Structure

```
financeflow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   └── utils/          # Utility functions
│   ├── Dockerfile
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── config/         # Database config
│   ├── Dockerfile
│   └── package.json
├── shared/                 # Shared TypeScript types
│   └── types.ts
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized setup)
- PostgreSQL (for local development)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd financeflow
   ```

2. **Copy environment files**
   ```bash
   cp .env.example .env
   cp client/.env.example client/.env
   ```

3. **Configure environment variables**
   
   Edit `.env`:
   ```env
   PASSWORD=your_secure_password_here
   DATABASE_URL=postgresql://username:password@localhost:5432/financeflow
   PORT=5000
   NODE_ENV=development
   ```
   
   Edit `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

### Option 1: Docker Setup (Recommended)

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Initialize database** (first time only)
   ```bash
   docker-compose exec postgres psql -U financeflow -d financeflow -f /docker-entrypoint-initdb.d/schema.sql
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Default password: `financeflow123`

### Option 2: Local Development Setup

1. **Setup PostgreSQL**
   - Install PostgreSQL locally
   - Create a database named `financeflow`
   - Run the schema file: `psql -d financeflow -f server/src/config/schema.sql`

2. **Install and start backend**
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Install and start frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Authentication

The app uses a simple password-based authentication system:

1. On first visit, users see a password entry screen
2. Enter the correct password (set in environment variables)
3. On successful authentication, a cookie is set for 30 days
4. Users can logout to clear the authentication cookie

**Default Password**: Set in your `.env` file or use `financeflow123` for Docker setup.

## API Endpoints

### Authentication
- `POST /api/auth` - Authenticate with password

### Accounts (Coming Soon)
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions (Coming Soon)
- `GET /api/transactions` - Get transactions with filters
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories (Coming Soon)
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category

### Budgets (Coming Soon)
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget

### Analytics (Coming Soon)
- `GET /api/analytics/overview` - Get financial overview
- `GET /api/analytics/spending-by-category` - Get spending breakdown

## Development

### Running Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

### Building for Production
```bash
# Build backend
cd server && npm run build

# Build frontend
cd client && npm run build
```

### Database Management

The database schema includes:
- **accounts** - Financial accounts (checking, savings, etc.)
- **categories** - Transaction categories
- **transactions** - Financial transactions
- **budgets** - Budget allocations
- **goals** - Financial goals

Default categories are automatically inserted on database initialization.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security Notes

- This is designed for single-user/family use
- Uses simple password authentication (no user accounts)
- All data is shared among authenticated users
- Ensure to use a strong password in production
- Consider additional security measures for public deployments

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions, please open an issue on the GitHub repository.