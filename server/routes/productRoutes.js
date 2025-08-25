const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const { validateProductId } = require('../middleware/validation');

// GET /api/products/:id - Fetch single product details
router.get('/:id', validateProductId, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product is not available'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details'
    });
  }
});

// GET /api/products/:id/reviews - Fetch product reviews
router.get('/:id/reviews', validateProductId, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const skip = (page - 1) * limit;

    // Define sort options
    let sortOptions = {};
    switch (sort) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest-rating':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'lowest-rating':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'most-helpful':
        sortOptions = { 'helpful.count': -1, createdAt: -1 };
        break;
      default: // newest
        sortOptions = { createdAt: -1 };
    }

    const reviews = await Review.find({ 
      productId: req.params.id, 
      isActive: true 
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ 
      productId: req.params.id, 
      isActive: true 
    });

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { productId: req.params.id, isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { productId: req.params.id, isActive: true } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: skip + reviews.length < totalReviews,
          hasPrev: page > 1
        },
        summary: {
          averageRating: avgRating.length > 0 ? avgRating[0].average : 0,
          totalReviews,
          ratingDistribution: ratingDistribution.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product reviews'
    });
  }
});

// GET /api/products/:id/related - Fetch related products
router.get('/:id/related', validateProductId, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: req.params.id },
      category: product.category,
      isActive: true
    })
    .select('title price images rating stock variants')
    .sort({ 'rating.average': -1, createdAt: -1 })
    .limit(8);

    // If not enough products in same category, get from similar price range
    if (relatedProducts.length < 4) {
      const priceRange = product.price * 0.3; // 30% price range
      const additionalProducts = await Product.find({
        _id: { 
          $ne: req.params.id,
          $nin: relatedProducts.map(p => p._id)
        },
        price: {
          $gte: product.price - priceRange,
          $lte: product.price + priceRange
        },
        isActive: true
      })
      .select('title price images rating stock variants')
      .sort({ 'rating.average': -1 })
      .limit(8 - relatedProducts.length);

      relatedProducts.push(...additionalProducts);
    }

    res.json({
      success: true,
      data: relatedProducts
    });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products'
    });
  }
});

// GET /api/products - Search and filter products (bonus endpoint)
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      sort = 'newest',
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true };

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = new RegExp(category, 'i');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    let sortOptions = {};
    switch (sort) {
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { 'rating.average': -1 };
        break;
      case 'popular':
        sortOptions = { 'rating.count': -1 };
        break;
      default: // newest
        sortOptions = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .select('title price images rating stock category variants')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalProducts / limit),
          totalProducts,
          hasNext: skip + products.length < totalProducts,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

module.exports = router;