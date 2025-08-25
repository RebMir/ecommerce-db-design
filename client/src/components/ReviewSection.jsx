import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, User, Calendar, CheckCircle, Filter } from 'lucide-react';
import { productAPI, utils } from '../services/api';

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState(null);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        
        // For demo purposes, if productId is 'default', use mock data
        if (productId === 'default' || productId === 'demo-product-1') {
          setReviews(mockReviews);
          setSummary(mockSummary);
          setPagination(mockPagination);
          setLoading(false);
          return;
        }
        
        const response = await productAPI.getProductReviews(productId, {
          page: currentPage,
          limit: 5,
          sort: sortBy
        });
        
        if (response.success) {
          setReviews(response.data.reviews);
          setSummary(response.data.summary);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadReviews();
    }
  }, [productId, currentPage, sortBy]);

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render rating distribution
  const renderRatingDistribution = () => {
    if (!summary?.ratingDistribution) return null;

    const total = summary.totalReviews;
    
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary.ratingDistribution[rating] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center space-x-3 text-sm">
              <span className="w-8 text-gray-600">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-600 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Handle helpful vote (mock implementation)
  const handleHelpfulVote = (reviewId) => {
    setReviews(prev => prev.map(review => 
      review._id === reviewId 
        ? { ...review, helpful: { ...review.helpful, count: review.helpful.count + 1 } }
        : review
    ));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
        
        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {summary.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex justify-center mb-1">
                    {renderStars(Math.round(summary.averageRating || 0))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {summary.totalReviews} reviews
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Rating Breakdown</h3>
              {renderRatingDistribution()}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-600">
            Showing {reviews.length} of {summary?.totalReviews || 0} reviews
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest-rating">Highest Rating</option>
              <option value="lowest-rating">Lowest Rating</option>
              <option value="most-helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {reviews.map((review, index) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  {/* Review Header */}
                  <div className="flex items-start space-x-4 mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {review.user.avatar ? (
                        <img
                          src={review.user.avatar}
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                        {review.verified && (
                          <div className="flex items-center text-success-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Verified Purchase</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {utils.formatDate(review.createdAt)}
                        </span>
                      </div>

                      {review.variant && (
                        <div className="mt-1 text-xs text-gray-500">
                          Variant: {review.variant.size} - {review.variant.color}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="ml-14">
                    <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                    <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                    
                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex space-x-2 mb-3">
                        {review.images.map((image, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={image.url}
                            alt={image.alt || `Review image ${imgIndex + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}

                    {/* Helpful Button */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleHelpfulVote(review._id)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Helpful ({review.helpful.count})</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                const isCurrentPage = page === pagination.currentPage;
                
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-sm rounded ${
                        isCurrentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === pagination.currentPage - 2 ||
                  page === pagination.currentPage + 2
                ) {
                  return <span key={page} className="text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={!pagination.hasNext}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// Mock data for demo
const mockSummary = {
  averageRating: 4.6,
  totalReviews: 247,
  ratingDistribution: {
    5: 147,
    4: 68,
    3: 21,
    2: 7,
    1: 4
  }
};

const mockPagination = {
  currentPage: 1,
  totalPages: 50,
  totalReviews: 247,
  hasNext: true,
  hasPrev: false
};

const mockReviews = [
  {
    _id: 'review-1',
    user: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: ''
    },
    rating: 5,
    title: 'Exceptional sound quality!',
    comment: 'These headphones exceeded my expectations. The noise cancellation is incredible and the battery life is exactly as advertised. Perfect for long flights and daily commutes. The build quality feels premium and comfortable for extended wear.',
    verified: true,
    helpful: { count: 23 },
    variant: { size: 'Standard', color: 'Black' },
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    _id: 'review-2',
    user: {
      name: 'Mike Chen',
      email: 'mike@example.com',
      avatar: ''
    },
    rating: 4,
    title: 'Great value for money',
    comment: 'Really impressed with these headphones. The sound is crisp and clear, and the noise cancellation works well in most environments. Only minor complaint is that they can get a bit warm during long sessions, but overall very satisfied.',
    verified: true,
    helpful: { count: 15 },
    variant: { size: 'Standard', color: 'White' },
    createdAt: '2024-01-12T14:20:00Z'
  },
  {
    _id: 'review-3',
    user: {
      name: 'Emily Rodriguez',
      email: 'emily@example.com',
      avatar: ''
    },
    rating: 5,
    title: 'Perfect for work from home',
    comment: 'As someone who works from home and takes lots of video calls, these headphones have been a game changer. The microphone quality is excellent and the comfort level is outstanding. I can wear them for 8+ hours without any discomfort.',
    verified: true,
    helpful: { count: 31 },
    variant: { size: 'Pro', color: 'Black' },
    createdAt: '2024-01-10T09:15:00Z'
  },
  {
    _id: 'review-4',
    user: {
      name: 'David Thompson',
      email: 'david@example.com',
      avatar: ''
    },
    rating: 4,
    title: 'Solid performance',
    comment: 'Good headphones with reliable performance. The battery life is impressive and the quick charge feature is very convenient. Sound quality is good across different music genres. Would recommend for anyone looking for a dependable pair of wireless headphones.',
    verified: false,
    helpful: { count: 8 },
    variant: { size: 'Standard', color: 'Silver' },
    createdAt: '2024-01-08T16:45:00Z'
  },
  {
    _id: 'review-5',
    user: {
      name: 'Lisa Park',
      email: 'lisa@example.com',
      avatar: ''
    },
    rating: 5,
    title: 'Highly recommended!',
    comment: 'These are by far the best headphones I\'ve owned. The active noise cancellation is phenomenal - I can actually focus in noisy environments now. The touch controls are intuitive and the foldable design makes them perfect for travel. Worth every penny!',
    verified: true,
    helpful: { count: 42 },
    variant: { size: 'Pro', color: 'White' },
    createdAt: '2024-01-05T11:30:00Z'
  }
];

export default ReviewSection;