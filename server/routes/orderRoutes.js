const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validateOrder } = require('../middleware/validation');

// POST /api/orders - Create a new order
router.post('/', validateOrder, async (req, res) => {
  try {
    const { 
      customer, 
      items, 
      paymentMethod, 
      shippingAddress,
      notes 
    } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product is not available: ${product.title}`
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      // Check variant stock if variant is specified
      if (item.variant && product.variants.length > 0) {
        const variant = product.variants.find(v => 
          v.size === item.variant.size && v.color === item.variant.color
        );
        
        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Variant not found for ${product.title}: ${item.variant.size} - ${item.variant.color}`
          });
        }

        if (variant.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient variant stock for ${product.title} (${item.variant.size} - ${item.variant.color}). Available: ${variant.stock}, Requested: ${item.quantity}`
          });
        }
      }

      const itemPrice = item.variant && product.variants.length > 0 
        ? product.variants.find(v => v.size === item.variant.size && v.color === item.variant.color).price
        : product.price;

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        title: product.title,
        image: product.mainImage ? product.mainImage.url : (product.images[0] ? product.images[0].url : ''),
        price: itemPrice,
        quantity: item.quantity,
        variant: item.variant || {}
      });
    }

    // Calculate tax and shipping
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const totalAmount = subtotal + tax + shippingCost;

    // Create order
    const order = new Order({
      customer,
      items: orderItems,
      subtotal,
      tax,
      shipping: {
        cost: shippingCost,
        address: shippingAddress
      },
      totalAmount,
      paymentMethod,
      notes: {
        customer: notes || ''
      }
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (item.variant && product.variants.length > 0) {
        // Update variant stock
        const variantIndex = product.variants.findIndex(v => 
          v.size === item.variant.size && v.color === item.variant.color
        );
        if (variantIndex !== -1) {
          product.variants[variantIndex].stock -= item.quantity;
        }
      }
      
      // Update total product stock
      product.stock -= item.quantity;
      await product.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
});

// GET /api/orders/:id - Get order details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title images category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details'
    });
  }
});

// GET /api/orders/number/:orderNumber - Get order by order number
router.get('/number/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product', 'title images category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details'
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (notes) {
      order.notes.admin = notes;
    }

    if (status === 'shipped' && !order.estimatedDelivery) {
      // Set estimated delivery to 3-5 business days from now
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 4);
      order.estimatedDelivery = deliveryDate;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
});

// GET /api/orders - Get orders (with filtering and pagination)
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      paymentStatus, 
      email, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Filters
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (email) query['customer.email'] = new RegExp(email, 'i');

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('items.product', 'title images')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: skip + orders.length < totalOrders,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

module.exports = router;