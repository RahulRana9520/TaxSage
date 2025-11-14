# CA Project - Personal Finance Management App

A modern personal finance management application built with Next.js 15, React 19, and TypeScript.

## Features

- **User Authentication**: Secure login/signup system
- **Expense Tracking**: Add and categorize expenses
- **Budget Management**: Set and track monthly budgets
- **Income Management**: Record income from multiple sources
- **Financial Goals**: Set and monitor financial goals
- **AI Chat Assistant**: Get financial advice through AI-powered chat
- **Analytics Dashboard**: Visualize your financial data
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI components
- **Charts**: Recharts
- **Database**: Oracle ORDS (with in-memory fallback)
- **AI**: OpenRouter API integration

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- (Optional) Oracle Database with ORDS enabled

## Getting Started

### 1. Clone and Install Dependencies

```bash
cd "e:\\CA project"
npm install --legacy-peer-deps
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
# Required for AI chat functionality
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: OpenRouter model selection
OPENROUTER_MODEL=openai/gpt-4o-mini

# Optional: Oracle ORDS Database (falls back to in-memory storage)
# ORACLE_ORDS_BASE_URL=https://your-oracle-instance.com
# ORACLE_ORDS_SCHEMA=your_schema_name
# ORACLE_ORDS_AUTH=Basic your_base64_encoded_credentials
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── data/         # Data management endpoints
│   │   ├── expenses/     # Expense management
│   │   ├── chat/         # AI chat endpoint
│   │   └── analytics/    # Analytics endpoint
│   ├── dashboard/        # Dashboard page
│   ├── login/           # Login page
│   └── onboarding/      # Onboarding flow
├── components/           # Reusable React components
│   ├── ui/              # Base UI components (Radix UI)
│   └── auth/            # Authentication components
├── lib/                 # Utility libraries
│   ├── auth.ts          # Authentication utilities
│   ├── repository.ts    # Data layer
│   ├── ai.ts           # AI integration
│   └── analytics.ts     # Analytics utilities
├── hooks/              # Custom React hooks
└── public/             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Data Management
- `POST /api/data/profile` - Update user profile
- `POST /api/data/income` - Add income entries
- `POST /api/data/budget` - Set budget allocations
- `POST /api/data/goal` - Set financial goals

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Add expense

### Analytics & AI
- `GET /api/analytics` - Get financial analytics
- `POST /api/chat` - AI chat assistant
- `GET /api/me` - Get user data

## Database Setup (Optional)

If you want to use Oracle Database instead of in-memory storage:

1. Set up Oracle Database with ORDS enabled
2. Run the SQL scripts in `scripts/oracle/`:
   - `001_create_tables.sql` - Creates required tables
   - `002_ords_modules.sql` - Sets up ORDS modules
3. Configure the environment variables in `.env.local`

## Troubleshooting

### Dependency Conflicts
If you encounter dependency conflicts during installation, use:
```bash
npm install --legacy-peer-deps
```

### Environment Variables
Make sure to set up your `.env.local` file with the required API keys, especially `OPENROUTER_API_KEY` for the AI chat functionality.

### TypeScript Errors
The project is configured to ignore TypeScript build errors in production. If you encounter development issues, check:
- All dependencies are installed
- `next-env.d.ts` exists in the root directory
- TypeScript version compatibility

## License

This project is for demonstration purposes.


https://docs.google.com/spreadsheets/d/1QtpIqXQzbOccJoBPQ5ciSlM1AlEGgrRHS5Vc8Pq0aSM/edit

1. Selected GCP Project ✓
Project Name: My First Project

Project ID: wide-pulsar-478216-n3

2. Enabled Google Sheets API ✓
Status: Enabled and ready to use

3. Created Service Account ✓
Name: financial-management-sheets

Email: financial-management-sheets@wide-pulsar-478216-n3.iam.gserviceaccount.com

Description: Service account for Financial Management System Google Sheets access

4. Downloaded JSON Key File ✓
Filename: wide-pulsar-478216-n3-d9034b7e0922.json

The file has been downloaded to your Downloads folder

⚠️ Important: Keep this file secure - it provides access to your cloud resources!

5. Shared Google Sheet ✓
Shared the Financial Management System spreadsheet with the service account

Permission Level: Editor (allows read and write access)

📝 For Step 3 - Add to your .env.local file:
text
GOOGLE_SERVICE_ACCOUNT_KEY='<paste the entire content of wide-pulsar-478216-n3-d9034b7e0922.json here>'
GOOGLE_SHEETS_ID="1QtpIqXQzbOccJoBPQ5ciSlM1AlEGgrRHS5Vc8Pq0aSM"
How to get the JSON content:
Open the downloaded file wide-pulsar-478216-n3-d9034b7e0922.json from your Downloads folder

Copy the entire JSON content (it will look like {"type":"service_account","project_id":"wide-pulsar-478216-n3",...})

Paste it as the value for GOOGLE_SERVICE_ACCOUNT_KEY (keep it on one line or use proper JSON escaping)

Your Financial Management System is now fully set up and ready to interact with Google Sheets via the API! 🚀