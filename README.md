# CamConnect

Modern live video chat platform for connecting with people worldwide. Features WebRTC video streaming, user authentication, payment processing, and moderation tools.

## Features

- **Live Video Chat**: WebRTC-based peer-to-peer video streaming
- **User Authentication**: Registration and login with JWT tokens
- **Gender Filtering**: Premium users can filter by gender
- **Payment Processing**: Stripe integration for premium memberships
- **Moderation System**: Admin panel for user management and reports
- **Anonymous Chat**: Optional anonymous mode for basic users
- **Modern UI**: Clean, responsive design with smooth animations

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Socket.IO client
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: Stripe
- **Video**: WebRTC

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas)
- Stripe account (for payments)

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd newwebsite2026
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/camconnect
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLIENT_URL=http://localhost:3000
```

4. Start MongoDB (if using local):
```bash
mongod
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. Open your browser:
```
http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Payments
- `POST /api/payment/create-checkout-session` - Create Stripe checkout
- `POST /api/payment/webhook` - Stripe webhook handler

### Reports
- `POST /api/report` - Report a user (requires auth)

### Admin
- `GET /api/admin/reports` - Get all reports (admin only)
- `PATCH /api/admin/reports/:id` - Update report status (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/:id/ban` - Ban a user (admin only)

## Project Structure

```
├── server.js               # Backend server with Express & Socket.IO
├── package.json            # Dependencies and scripts
├── vercel.json             # Vercel deployment config
├── .env.example            # Environment variables template
├── index.html              # Homepage
├── js/
│   ├── main.js             # Frontend JavaScript
│   └── video-chat.js       # WebRTC video chat client
├── html/
│   ├── css/
│   │   └── style.css       # Stylesheet
│   └── pages/
│       ├── faq.html        # FAQ page
│       ├── terms.html      # Terms of Service
│       ├── privacy.html    # Privacy Policy
│       └── contact.html    # Contact page
```

## Deployment

### Deploy with Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Set environment variables in Vercel dashboard:
   - MONGODB_URI
   - JWT_SECRET
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - CLIENT_URL

4. Deploy:
```bash
vercel
```

### MongoDB Setup

**Option 1: MongoDB Atlas (Recommended for production)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Add to environment variables

**Option 2: Local MongoDB**
```bash
# Install MongoDB
# Windows: Download from mongodb.com
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod

# Or as a service
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
```

### Stripe Setup

1. Create account at https://stripe.com
2. Get API keys from Dashboard
3. Add keys to environment variables
4. Set up webhook endpoint for payment success

## Pages

- `/` - Homepage with video chat
- `/faq` - Frequently Asked Questions
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/contact` - Contact Us

## Customization

To customize this site for your brand:

1. Update the site name in all HTML files
2. Modify colors in `html/css/style.css` (CSS variables at the top)
3. Update meta tags and social media links
4. Customize Stripe pricing in `server.js`
5. Add your own branding and content
6. Modify the gradient and color scheme in CSS

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Implement rate limiting
- Add input validation
- Use environment variables for sensitive data
- Enable CORS only for trusted domains
- Implement proper session management

## License

UNLICENSED
