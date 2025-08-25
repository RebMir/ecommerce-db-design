import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { productAPI, utils } from '../services/api';

const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(new Set());

  // Number of products to show per view
  const productsPerView = {
    mobile: 2,
    tablet: 3,
    desktop: 4
  };

  // Load related products
  useEffect(() => {
    const loadRelatedProducts = async () => {
      try {
        setLoading(true);
        
        // For demo purposes, use mock data
        if (productId === 'default' || productId === 'demo-product-1') {
          setProducts(mockRelatedProducts);
          setLoading(false);
          return;
        }
        
        const response = await productAPI.getRelatedProducts(productId);
        if (response.success) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Error loading related products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadRelatedProducts();
    }
  }, [productId]);

  // Handle wishlist toggle
  const toggleWishlist = (productId) => {
    setWishlisted(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    const maxIndex = Math.max(0, products.length - productsPerView.desktop);
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Render stars
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Get stock status badge
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    } else if (stock <= 5) {
      return <span className="badge badge-warning">Low Stock</span>;
    }
    return <span className="badge badge-success">In Stock</span>;
  };

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
        
        {/* Navigation Controls */}
        {products.length > productsPerView.desktop && (
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= products.length - productsPerView.desktop}
              className="p-2 rounded-full border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Products Grid/Carousel */}
      <div className="relative">
        <div className="overflow-hidden">
          <motion.div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / productsPerView.desktop)}%)`
            }}
          >
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                className="w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.mainImage?.url || product.images?.[0]?.url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product._id)}
                      className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          wishlisted.has(product._id)
                            ? 'text-red-500 fill-current'
                            : 'text-gray-600 hover:text-red-500'
                        }`}
                      />
                    </button>

                    {/* Stock Badge */}
                    <div className="absolute top-2 left-2">
                      {getStockBadge(product.stock)}
                    </div>

                    {/* Quick Add to Cart (on hover) */}
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button className="w-full btn btn-primary btn-sm flex items-center justify-center space-x-1">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {product.title}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(product.rating?.average || 0)}
                      <span className="text-xs text-gray-500">
                        ({product.rating?.count || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline space-x-1">
                        <span className="font-bold text-gray-900">
                          {utils.formatCurrency(product.price)}
                        </span>
                        {product.variants && product.variants.length > 0 && (
                          <span className="text-xs text-gray-500">from</span>
                        )}
                      </div>
                      
                      {/* Variant Count */}
                      {product.variants && product.variants.length > 1 && (
                        <span className="text-xs text-gray-500">
                          {product.variants.length} variants
                        </span>
                      )}
                    </div>

                    {/* Category */}
                    <div className="mt-2">
                      <span className="text-xs text-gray-500 capitalize">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex justify-center mt-4 md:hidden">
          <div className="flex space-x-2">
            {Array.from({ length: Math.ceil(products.length / productsPerView.mobile) }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i * productsPerView.mobile)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / productsPerView.mobile) === i
                    ? 'bg-primary-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* View All Button */}
      <div className="text-center mt-8">
        <button className="btn btn-outline btn-lg">
          View All Products
        </button>
      </div>
    </section>
  );
};

// Mock related products data
const mockRelatedProducts = [
  {
    _id: 'related-1',
    title: 'Wireless Earbuds Pro',
    price: 149,
    category: 'Electronics',
    stock: 25,
    rating: { average: 4.4, count: 89 },
    images: [
      { url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400', alt: 'Wireless Earbuds' }
    ],
    variants: [
      { size: 'Standard', color: 'Black', price: 149 },
      { size: 'Standard', color: 'White', price: 149 }
    ]
  },
  {
    _id: 'related-2',
    title: 'Bluetooth Speaker Portable',
    price: 79,
    category: 'Electronics',
    stock: 12,
    rating: { average: 4.2, count: 156 },
    images: [
      { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', alt: 'Bluetooth Speaker' }
    ]
  },
  {
    _id: 'related-3',
    title: 'USB-C Charging Cable',
    price: 19,
    category: 'Electronics',
    stock: 0,
    rating: { average: 4.1, count: 203 },
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', alt: 'USB-C Cable' }
    ]
  },
  {
    _id: 'related-4',
    title: 'Wireless Charging Pad',
    price: 39,
    category: 'Electronics',
    stock: 8,
    rating: { average: 4.3, count: 67 },
    images: [
      { url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400', alt: 'Charging Pad' }
    ]
  },
  {
    _id: 'related-5',
    title: 'Laptop Stand Adjustable',
    price: 59,
    category: 'Electronics',
    stock: 15,
    rating: { average: 4.6, count: 112 },
    images: [
      { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', alt: 'Laptop Stand' }
    ]
  },
  {
    _id: 'related-6',
    title: 'Phone Case Premium',
    price: 29,
    category: 'Electronics',
    stock: 30,
    rating: { average: 4.0, count: 89 },
    images: [
      { url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400', alt: 'Phone Case' }
    ],
    variants: [
      { size: 'iPhone 14', color: 'Clear', price: 29 },
      { size: 'iPhone 14', color: 'Black', price: 29 },
      { size: 'iPhone 15', color: 'Clear', price: 32 }
    ]
  }
];

export default RelatedProducts;