# ReBooked Solutions - University Textbook Marketplace

A modern React/TypeScript marketplace platform for university students to buy and sell textbooks.

## 🚀 Features

- **User Authentication** - Secure login/registration with Supabase
- **Book Marketplace** - Browse, search, and filter textbooks by university
- **Seller Tools** - List books with photos, pricing, and detailed descriptions  
- **Order Management** - 48-hour commit system with automatic refunds
- **Payment Processing** - Secure payments via Paystack integration
- **Delivery Tracking** - Integration with CourierGuy and other carriers
- **University Data** - Comprehensive course and program information
- **Activity Center** - Track orders, sales, and marketplace activity
- **Admin Dashboard** - Content moderation and analytics

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Paystack
- **Maps**: Google Maps API
- **Deployment**: Vercel, Netlify, Fly.io ready

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Paystack account (for payments)
- Google Maps API key (optional)

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment Processing
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Optional APIs
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_COURIER_GUY_API_KEY=your_courier_guy_key
VITE_FASTWAY_API_KEY=your_fastway_key

# App Configuration
VITE_APP_URL=http://localhost:8080
VITE_DISABLE_GOOGLE_MAPS=false
VITE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rebooked-solutions
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   ├── admin/          # Admin dashboard components
│   ├── checkout/       # Order and payment flows
│   └── ...
├── pages/              # Main application pages
├── services/           # API services and business logic
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── utils/              # Utility functions
├── constants/          # Static data (universities, courses)
├── types/              # TypeScript type definitions
└── styles/             # Global styles and CSS
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🛡️ Security Features

- Environment variable validation
- Input sanitization and validation
- CSRF protection via Supabase
- Secure payment processing
- Rate limiting on API endpoints

## 📚 Documentation

Additional documentation is available in the `docs/` directory:

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Email Integration](docs/EMAIL_INTEGRATION_GUIDE.md)
- [Google Maps Setup](docs/GOOGLE_MAPS_SETUP.md)
- [Banking System](docs/BANKING_SYSTEM.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions, please contact the development team or check the documentation in the `docs/` folder.
