import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  CreditCard,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';

// Import components and services
import ImageGallery from './ImageGallery';
import ReviewSection from './ReviewSection';
import RelatedProducts from './RelatedProducts';
import PaymentModal from './PaymentModal';
import { productAPI, utils } from '../services/api';

const ProductPage = ({ productId: propProductId }) => {
  const { id: paramProductId } = useParams();
  const productId = propProductId || paramProductId;

  // State management
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For demo purposes, if productId is 'default', use mock data
        if (productId === 'default') {
          setProduct(mockProduct);
          setLoading(false);
          return;
        }
        
        const response = await productAPI.getProduct(productId);
        if (response.success) {
          setProduct(response.data);
          // Set first variant as default if variants exist
          if (response.data.variants && response.data.variants.length > 0) {
            setSelectedVariant(response.data.variants[0]);
          }
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Handle quantity changes
  const handleQuantityChange = (change) => {
    const maxStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
    const newQuantity = Math.max(1, Math.min(quantity + change, maxStock));
    setQuantity(newQuantity);
  };

  // Handle variant selection
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity when variant changes
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      id: `${product._id}_${selectedVariant?.size || 'default'}_${selectedVariant?.color || 'default'}`,
      productId: product._id,
      title: product.title,
      price: selectedVariant?.price || product.price,
      image: product.mainImage?.url || product.images[0]?.url,
      quantity,
      variant: selectedVariant ? {
        size: selectedVariant.size,
        color: selectedVariant.color
      } : null,
      stock: selectedVariant?.stock || product.stock
    };

    // Add to cart (in a real app, this would be managed by a cart context or state manager)
    const existingItemIndex = cartItems.findIndex(item => item.id === cartItem.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCartItems(updatedItems);
    } else {
      setCartItems([...cartItems, cartItem]);
    }

    toast.success(`Added ${quantity} item(s) to cart`);
    
    // Animate button
    const button = document.getElementById('add-to-cart-btn');
    button?.classList.add('animate-bounce-subtle');
    setTimeout(() => {
      button?.classList.remove('animate-bounce-subtle');
    }, 600);
  };

  // Buy now - opens payment modal
  const handleBuyNow = () => {
    handleAddToCart(); // Add to cart first
    setShowPaymentModal(true);
  };

  // Toggle wishlist
  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Share product
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  // Get current price
  const getCurrentPrice = () => {
    return selectedVariant?.price || product?.price || 0;
  };

  // Get current stock
  const getCurrentStock = () => {
    return selectedVariant?.stock || product?.stock || 0;
  };

  // Get stock status
  const getStockStatus = () => {
    const stock = getCurrentStock();
    if (stock === 0) return { status: 'out-of-stock', text: 'Out of Stock', class: 'text-danger-600' };
    if (stock <= 5) return { status: 'low-stock', text: `Only ${stock} left`, class: 'text-warning-600' };
    return { status: 'in-stock', text: 'In Stock', class: 'text-success-600' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stockInfo = getStockStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">E-Store</h1>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ImageGallery images={product.images} />
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 lg:mt-0"
          >
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-4">
              <span>Home</span> &gt; <span>{product.category}</span> &gt; <span className="text-gray-900">{product.title}</span>
            </nav>

            {/* Product Title & Rating */}
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating?.average || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {product.rating?.average?.toFixed(1) || '0.0'} ({product.rating?.count || 0} reviews)
                  </span>
                </div>
                <span className="text-sm text-gray-400">|</span>
                <span className={`text-sm font-medium ${stockInfo.class}`}>
                  {stockInfo.text}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">
                  {utils.formatCurrency(getCurrentPrice())}
                </span>
                {selectedVariant && selectedVariant.price !== product.price && (
                  <span className="text-lg text-gray-500 line-through">
                    {utils.formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Variants Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                {/* Size Selection */}
                {product.variants.some(v => v.size) && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(product.variants.map(v => v.size))].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            const variant = product.variants.find(v => 
                              v.size === size && 
                              (!selectedVariant?.color || v.color === selectedVariant.color)
                            );
                            if (variant) handleVariantSelect(variant);
                          }}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                            selectedVariant?.size === size
                              ? 'border-primary-600 bg-primary-50 text-primary-600'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.variants.some(v => v.color) && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(product.variants.map(v => v.color))].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            const variant = product.variants.find(v => 
                              v.color === color && 
                              (!selectedVariant?.size || v.size === selectedVariant.size)
                            );
                            if (variant) handleVariantSelect(variant);
                          }}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                            selectedVariant?.color === color
                              ? 'border-primary-600 bg-primary-50 text-primary-600'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="quantity-btn p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= getCurrentStock()}
                    className="quantity-btn p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {getCurrentStock()} available
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  id="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={getCurrentStock() === 0}
                  className="btn btn-outline btn-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={getCurrentStock() === 0}
                  className="btn btn-primary btn-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Buy Now
                </button>
              </div>
              
              <div className="flex items-center justify-center space-x-6 mt-4">
                <button
                  onClick={handleWishlistToggle}
                  className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Heart className={`h-5 w-5 mr-1 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Share2 className="h-5 w-5 mr-1" />
                  Share
                </button>
              </div>
            </div>

            {/* Product Features */}
            <div className="border-t pt-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm text-gray-600">Free shipping</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm text-gray-600">2 year warranty</span>
                </div>
                <div className="flex items-center">
                  <RotateCcw className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm text-gray-600">30-day returns</span>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <div className="prose prose-sm text-gray-600">
                <p>{product.description}</p>
                
                {product.features && product.features.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <ReviewSection productId={product._id} />
        </motion.div>

        {/* Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16"
        >
          <RelatedProducts productId={product._id} />
        </motion.div>
      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            cartItems={cartItems}
            product={product}
            selectedVariant={selectedVariant}
            quantity={quantity}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Mock product data for demo
const mockProduct = {
  _id: 'demo-product-1',
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
    },
    {
      url: 'https://images.unsplash.com/photo-1496957961599-e35b69ef5d7c?w=800',
      alt: 'Wireless Headphones - In Use'
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
  specifications: {
    'Driver Size': '40mm',
    'Frequency Response': '20Hz - 20kHz',
    'Impedance': '32 ohms',
    'Weight': '250g',
    'Connectivity': 'Bluetooth 5.0, 3.5mm jack',
    'Battery': '30 hours wireless, 40 hours wired'
  },
  isActive: true,
  stockStatus: 'in-stock'
};

export default ProductPage;