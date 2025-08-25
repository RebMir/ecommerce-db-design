# 🛍️ E-commerce Product Page - MERN Stack

A complete full-stack e-commerce product page built with the MERN stack (MongoDB, Express, React, Node.js) featuring modern UI with TailwindCSS, smooth animations with Framer Motion, and integrated payment options including M-Pesa and Bank Transfer.

## ✨ Features

### Frontend (React + TailwindCSS + Framer Motion)
- **Product Image Gallery** - Interactive image carousel with zoom functionality
- **Product Details** - Comprehensive product information with variants (size/color)
- **Reviews & Ratings** - Customer reviews with rating distribution and pagination
- **Related Products** - Intelligent product recommendations
- **Payment Modal** - Integrated payment system with multiple options
- **Responsive Design** - Mobile-first approach with smooth animations
- **Real-time Updates** - Dynamic stock status and pricing

### Backend (Express + MongoDB)
- **RESTful API** - Clean, well-documented API endpoints
- **Product Management** - Full CRUD operations for products
- **Order Processing** - Complete order lifecycle management
- **Payment Integration** - M-Pesa STK Push and Bank Transfer simulation
- **Review System** - Customer reviews with helpful voting
- **Data Validation** - Input validation and error handling
- **Security** - Input sanitization and rate limiting ready

### Payment Methods
- **M-Pesa STK Push** - Simulated Safaricom Daraja API integration
- **Bank Transfer** - Manual verification system with admin controls
- **Order Tracking** - Real-time order status updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-product-page
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm run install-server
   
   # Install client dependencies
   npm run install-client
   ```

3. **Environment Setup**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   
   # M-Pesa Configuration (Safaricom Daraja API)
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_BUSINESS_SHORT_CODE=174379
   MPESA_PASSKEY=your_passkey
   ```

4. **Database Setup**
   ```bash
   # Seed the database with sample data
   node server/scripts/seedData.js
   ```

5. **Start the application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or run separately:
   npm run server  # Starts backend on port 5000
   npm run client  # Starts frontend on port 3000
   ```

## 📡 API Endpoints

### Products
- `GET /api/products/:id` - Get product details
- `GET /api/products/:id/reviews` - Get product reviews
- `GET /api/products/:id/related` - Get related products
- `GET /api/products` - Search/filter products

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Payments
- `POST /api/payments/mpesa` - Initiate M-Pesa payment
- `GET /api/payments/mpesa/status/:id` - Check M-Pesa status
- `POST /api/payments/bank` - Process bank transfer
- `POST /api/payments/bank/verify` - Verify bank transfer (admin)

## 🏗️ Project Structure

```
ecommerce-product-page/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductPage.jsx      # Main product page
│   │   │   ├── ImageGallery.jsx     # Image carousel
│   │   │   ├── PaymentModal.jsx     # Payment interface
│   │   │   ├── ReviewSection.jsx    # Reviews display
│   │   │   └── RelatedProducts.jsx  # Product recommendations
│   │   ├── services/
│   │   │   └── api.js               # API service layer
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
├── server/                     # Express backend
│   ├── models/
│   │   ├── Product.js              # Product schema
│   │   ├── Review.js               # Review schema
│   │   └── Order.js                # Order schema
│   ├── routes/
│   │   ├── productRoutes.js        # Product endpoints
│   │   ├── orderRoutes.js          # Order endpoints
│   │   └── paymentRoutes.js        # Payment endpoints
│   ├── middleware/
│   │   └── validation.js           # Input validation
│   ├── scripts/
│   │   └── seedData.js             # Database seeder
│   └── server.js                   # Express app
├── package.json                # Root package.json
├── .env                        # Environment variables
└── README.md
```

## 🎨 UI Components

### ProductPage
- **Image Gallery** - Multi-image carousel with zoom
- **Product Info** - Title, price, description, variants
- **Quantity Selector** - Stock-aware quantity controls
- **Action Buttons** - Add to cart, buy now, wishlist
- **Features Display** - Key product features and specs

### PaymentModal
- **Method Selection** - M-Pesa and Bank Transfer options
- **Customer Form** - Contact and shipping information
- **Payment Processing** - Real-time status updates
- **Success/Error States** - Clear feedback and next steps

### ReviewSection
- **Rating Summary** - Average rating and distribution
- **Review List** - Paginated reviews with sorting
- **Helpful Voting** - Community-driven review ranking

### RelatedProducts
- **Product Grid** - Responsive product recommendations
- **Quick Actions** - Add to cart and wishlist
- **Navigation** - Carousel controls for large datasets

## 💳 Payment Integration

### M-Pesa STK Push
```javascript
// Initiate M-Pesa payment
const response = await paymentAPI.initiateMpesaPayment({
  phoneNumber: '254701234567',
  amount: 299,
  orderId: 'order_id'
});

// Check payment status
const status = await paymentAPI.checkMpesaStatus(checkoutRequestId);
```

### Bank Transfer
```javascript
// Process bank transfer
const response = await paymentAPI.processBankTransfer({
  orderId: 'order_id',
  referenceNumber: 'TXN123456',
  bankName: 'Equity Bank'
});
```

## 🔧 Customization

### Adding New Payment Methods
1. Update `paymentRoutes.js` with new endpoint
2. Add validation in `validation.js`
3. Update `PaymentModal.jsx` with new UI
4. Add API method in `api.js`

### Extending Product Schema
```javascript
// In Product.js model
const productSchema = new mongoose.Schema({
  // Existing fields...
  newField: {
    type: String,
    required: true
  }
});
```

### Custom Animations
```javascript
// Using Framer Motion
const customAnimation = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 }
};
```

## 🧪 Testing

```bash
# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test

# Run E2E tests
npm run test:e2e
```

## 📦 Deployment

### Frontend (Netlify/Vercel)
```bash
cd client
npm run build
# Deploy the build folder
```

### Backend (Heroku/Railway)
```bash
# Set environment variables
# Deploy from root directory
```

### Database (MongoDB Atlas)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce
```

## 🛡️ Security Features

- Input validation with Joi
- MongoDB injection prevention
- Rate limiting ready
- CORS configuration
- Environment variable protection
- Secure payment processing

## 🎯 Performance Optimizations

- Image lazy loading
- Component code splitting
- API response caching
- Database indexing
- Optimized bundle size
- CDN-ready assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- [ ] User authentication system
- [ ] Advanced search and filtering
- [ ] Inventory management
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] PWA capabilities
- [ ] Advanced payment options

---

Built with ❤️ using the MERN stack