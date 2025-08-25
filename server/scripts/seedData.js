const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
require('dotenv').config();

// Sample product data
const sampleProducts = [
  {
    title: 'Premium Wireless Headphones',
    description: 'Experience premium sound quality with these wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort. Perfect for music lovers, professionals, and travelers.',
    price: 299,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        alt: 'Wireless Headphones - Main View',
        isMain: true
      },
      {
        url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
        alt: 'Wireless Headphones - Side View'
      },
      {
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
        alt: 'Wireless Headphones - Detail View'
      }
    ],
    variants: [
      { size: 'Standard', color: 'Black', stock: 15, price: 299 },
      { size: 'Standard', color: 'White', stock: 8, price: 299 },
      { size: 'Standard', color: 'Silver', stock: 12, price: 319 },
      { size: 'Pro', color: 'Black', stock: 5, price: 399 },
      { size: 'Pro', color: 'White', stock: 3, price: 399 }
    ],
    stock: 43,
    category: 'Electronics',
    brand: 'TechAudio',
    rating: {
      average: 4.6,
      count: 247
    },
    features: [
      'Active Noise Cancellation',
      '30-hour battery life',
      'Quick charge (15 min = 3 hours)',
      'Premium comfort padding',
      'Wireless & wired connectivity',
      'Built-in microphone',
      'Touch controls',
      'Foldable design'
    ],
    specifications: new Map([
      ['Driver Size', '40mm'],
      ['Frequency Response', '20Hz - 20kHz'],
      ['Impedance', '32 ohms'],
      ['Weight', '250g'],
      ['Connectivity', 'Bluetooth 5.0, 3.5mm jack'],
      ['Battery', '30 hours wireless, 40 hours wired']
    ])
  },
  {
    title: 'Smart Fitness Watch',
    description: 'Track your fitness goals with this advanced smartwatch featuring GPS, heart rate monitoring, sleep tracking, and 7-day battery life.',
    price: 249,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        alt: 'Smart Watch - Main View',
        isMain: true
      },
      {
        url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
        alt: 'Smart Watch - Side View'
      }
    ],
    variants: [
      { size: '42mm', color: 'Black', stock: 20, price: 249 },
      { size: '42mm', color: 'Silver', stock: 15, price: 249 },
      { size: '46mm', color: 'Black', stock: 10, price: 279 },
      { size: '46mm', color: 'Gold', stock: 5, price: 299 }
    ],
    stock: 50,
    category: 'Electronics',
    brand: 'FitTech',
    rating: {
      average: 4.3,
      count: 189
    },
    features: [
      'GPS tracking',
      'Heart rate monitor',
      'Sleep tracking',
      '7-day battery life',
      'Water resistant (50m)',
      '100+ workout modes',
      'Smart notifications',
      'Music control'
    ]
  },
  {
    title: 'Wireless Charging Pad',
    description: 'Fast wireless charging for all Qi-enabled devices. Sleek design with LED indicator and over-charge protection.',
    price: 39,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
        alt: 'Wireless Charger',
        isMain: true
      }
    ],
    stock: 100,
    category: 'Electronics',
    brand: 'ChargeFast',
    rating: {
      average: 4.1,
      count: 67
    },
    features: [
      'Fast 15W charging',
      'Qi-certified',
      'Over-charge protection',
      'LED charging indicator',
      'Non-slip surface',
      'Compact design'
    ]
  }
];

// Sample reviews data
const sampleReviews = [
  {
    user: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com'
    },
    rating: 5,
    title: 'Exceptional sound quality!',
    comment: 'These headphones exceeded my expectations. The noise cancellation is incredible and the battery life is exactly as advertised.',
    verified: true,
    helpful: { count: 23 },
    variant: { size: 'Standard', color: 'Black' }
  },
  {
    user: {
      name: 'Mike Chen',
      email: 'mike@example.com'
    },
    rating: 4,
    title: 'Great value for money',
    comment: 'Really impressed with these headphones. The sound is crisp and clear, and the noise cancellation works well in most environments.',
    verified: true,
    helpful: { count: 15 },
    variant: { size: 'Standard', color: 'White' }
  },
  {
    user: {
      name: 'Emily Rodriguez',
      email: 'emily@example.com'
    },
    rating: 5,
    title: 'Perfect for work from home',
    comment: 'As someone who works from home and takes lots of video calls, these headphones have been a game changer.',
    verified: true,
    helpful: { count: 31 },
    variant: { size: 'Pro', color: 'Black' }
  }
];

// Connect to database and seed data
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    // Insert products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} products`);

    // Insert reviews for first product
    const reviewsToInsert = sampleReviews.map(review => ({
      ...review,
      productId: products[0]._id
    }));
    
    const reviews = await Review.insertMany(reviewsToInsert);
    console.log(`Inserted ${reviews.length} reviews`);

    // Update product rating based on reviews
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(products[0]._id, {
      'rating.average': avgRating,
      'rating.count': reviews.length
    });

    console.log('Database seeded successfully!');
    console.log('\nSample product IDs:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}: ${product._id}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleProducts, sampleReviews };