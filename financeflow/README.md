# FinanceFlow - Personal Finance Tracking App

A comprehensive personal finance tracking web application built with Next.js, TypeScript, and PostgreSQL.

## Features

- **Authentication**: Single password protection for personal use
- **Dashboard**: Overview of financial status with quick stats
- **Transactions**: Track income and expenses with detailed categorization
- **Accounts**: Manage multiple accounts (checking, savings, credit cards, cash)
- **Budgets**: Set and monitor monthly spending budgets by category
- **Analytics**: Visual insights with charts and spending analysis
- **Dark Theme**: Modern dark UI design optimized for daily use

## Tech Stack

- **Frontend**: Next.js (Pages Router), TypeScript, React
- **Styling**: Inline styles with React.CSSProperties (no Tailwind)
- **Database**: PostgreSQL on Vercel
- **Charts**: Chart.js with react-chartjs-2
- **Deployment**: Vercel

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd financeflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your database credentials and password
   ```

4. **Set up the database**
   - Create a PostgreSQL database on Vercel
   - Update the connection strings in `.env.local`
   - Call the setup endpoint: `POST /api/finanzen/setup` to create tables and default data

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Database Setup

The app includes a setup endpoint that creates all necessary tables and adds default categories. After configuring your database connection, make a POST request to `/api/finanzen/setup` to initialize the database.

### Database Schema

- **kategorien**: Income and expense categories
- **konten**: User accounts (checking, savings, etc.)
- **transaktionen**: All financial transactions
- **budgets**: Monthly budget limits by category
- **sparziele**: Savings goals and progress

## Environment Variables

Required environment variables in `.env.local`:

```
PASSWORD=your_secure_password_here
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_connection_string
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_connection_string
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
```

## Deployment

The app is configured for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy

## Security

This app uses a simple shared password authentication system suitable for personal or family use. It includes:

- Cookie-based session management (30-day expiration)
- Server-side password validation
- SQL injection protection with parameterized queries
- Input validation on all forms

## Architecture

- **Pages Router**: Traditional Next.js routing
- **API Routes**: RESTful endpoints for all data operations
- **Component Structure**: Reusable components with inline styles
- **State Management**: React hooks with local state
- **Database**: Direct PostgreSQL queries using Vercel's SQL package

## Features Overview

### Dashboard
- Total balance across all accounts
- Monthly income and expense summary
- Budget status overview
- Recent transactions list

### Transactions
- Add/edit/delete transactions
- Filter by account, category, type, date range
- Search functionality
- Category management with icons and colors

### Accounts
- Multiple account types supported
- Real-time balance updates
- Color-coded account cards
- Account deletion protection

### Budgets
- Monthly budget setting by category
- Visual progress indicators
- Overspending alerts
- Budget vs actual spending analysis

### Analytics
- Monthly income vs expenses chart
- Category spending distribution
- Top spending categories
- Spending trends analysis

## Contributing

This is a personal finance app designed for individual use. Feel free to fork and customize for your needs.

## License

MIT License - feel free to use and modify as needed.