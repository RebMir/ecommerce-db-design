import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  X, 
  CreditCard, 
  Building, 
  Smartphone, 
  Check, 
  AlertCircle,
  Loader,
  Copy,
  ExternalLink
} from 'lucide-react';
import { orderAPI, paymentAPI, utils } from '../services/api';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  cartItems = [], 
  product, 
  selectedVariant, 
  quantity 
}) => {
  const [step, setStep] = useState('method'); // method, details, processing, success, error
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Kenya'
    }
  });
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [bankDetails, setBankDetails] = useState({
    referenceNumber: '',
    bankName: ''
  });
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);

  // Calculate order total
  const orderItems = cartItems.length > 0 ? cartItems : [{
    productId: product._id,
    title: product.title,
    price: selectedVariant?.price || product.price,
    quantity: quantity,
    variant: selectedVariant
  }];

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + tax + shipping;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setPaymentMethod('');
      setPaymentStatus(null);
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    }
  }, [isOpen]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate customer details
      if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
        throw new Error('Please fill in all required customer details');
      }

      // Create order
      const orderData = {
        customer: customerDetails,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: item.variant
        })),
        paymentMethod: paymentMethod,
        shippingAddress: customerDetails.address
      };

      const orderResponse = await orderAPI.createOrder(orderData);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      setOrder(orderResponse.data);
      setStep('processing');

      // Process payment based on method
      if (paymentMethod === 'mpesa') {
        await processMpesaPayment(orderResponse.data._id);
      } else if (paymentMethod === 'bank-transfer') {
        await processBankTransfer(orderResponse.data._id);
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Process M-Pesa payment
  const processMpesaPayment = async (orderId) => {
    try {
      const formattedPhone = utils.formatPhoneForMpesa(mpesaPhone);
      
      if (!utils.validateKenyanPhone(formattedPhone)) {
        throw new Error('Please enter a valid Kenyan phone number');
      }

      const mpesaResponse = await paymentAPI.initiateMpesaPayment({
        phoneNumber: formattedPhone,
        amount: total,
        orderId: orderId
      });

      if (mpesaResponse.success) {
        toast.success('STK Push sent to your phone!');
        setPaymentStatus(mpesaResponse.data);
        
        // Start checking payment status
        const intervalId = setInterval(async () => {
          try {
            const statusResponse = await paymentAPI.checkMpesaStatus(mpesaResponse.data.checkoutRequestId);
            
            if (statusResponse.data.status === 'success') {
              clearInterval(intervalId);
              setStatusCheckInterval(null);
              setStep('success');
              toast.success('Payment completed successfully!');
            } else if (statusResponse.data.status === 'failed') {
              clearInterval(intervalId);
              setStatusCheckInterval(null);
              setStep('error');
              toast.error('Payment failed. Please try again.');
            }
          } catch (error) {
            console.error('Status check error:', error);
          }
        }, 3000); // Check every 3 seconds
        
        setStatusCheckInterval(intervalId);
        
        // Auto-stop checking after 2 minutes
        setTimeout(() => {
          if (intervalId) {
            clearInterval(intervalId);
            setStatusCheckInterval(null);
            setStep('error');
            toast.error('Payment timeout. Please try again.');
          }
        }, 120000);
      }
    } catch (error) {
      throw error;
    }
  };

  // Process bank transfer
  const processBankTransfer = async (orderId) => {
    try {
      if (!bankDetails.referenceNumber || !bankDetails.bankName) {
        throw new Error('Please provide reference number and bank name');
      }

      const bankResponse = await paymentAPI.processBankTransfer({
        orderId: orderId,
        referenceNumber: bankDetails.referenceNumber,
        bankName: bankDetails.bankName
      });

      if (bankResponse.success) {
        setPaymentStatus(bankResponse.data);
        setStep('success');
        toast.success('Bank transfer details recorded successfully!');
      }
    } catch (error) {
      throw error;
    }
  };

  // Handle customer details change
  const handleCustomerDetailsChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomerDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCustomerDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'method' && 'Choose Payment Method'}
              {step === 'details' && 'Payment Details'}
              {step === 'processing' && 'Processing Payment'}
              {step === 'success' && 'Payment Successful'}
              {step === 'error' && 'Payment Failed'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Step 1: Payment Method Selection */}
            {step === 'method' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* M-Pesa Option */}
                  <motion.button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`payment-card p-6 border-2 rounded-xl text-left transition-all ${
                      paymentMethod === 'mpesa'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        paymentMethod === 'mpesa' ? 'bg-primary-600' : 'bg-gray-100'
                      }`}>
                        <Smartphone className={`h-6 w-6 ${
                          paymentMethod === 'mpesa' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">M-Pesa</h3>
                        <p className="text-sm text-gray-500">Pay with mobile money</p>
                      </div>
                    </div>
                    {paymentMethod === 'mpesa' && (
                      <div className="mt-3 flex items-center text-primary-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-sm">Selected</span>
                      </div>
                    )}
                  </motion.button>

                  {/* Bank Transfer Option */}
                  <motion.button
                    onClick={() => setPaymentMethod('bank-transfer')}
                    className={`payment-card p-6 border-2 rounded-xl text-left transition-all ${
                      paymentMethod === 'bank-transfer'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        paymentMethod === 'bank-transfer' ? 'bg-primary-600' : 'bg-gray-100'
                      }`}>
                        <Building className={`h-6 w-6 ${
                          paymentMethod === 'bank-transfer' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Bank Transfer</h3>
                        <p className="text-sm text-gray-500">Transfer to bank account</p>
                      </div>
                    </div>
                    {paymentMethod === 'bank-transfer' && (
                      <div className="mt-3 flex items-center text-primary-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-sm">Selected</span>
                      </div>
                    )}
                  </motion.button>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.title} x {item.quantity}</span>
                        <span>{utils.formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{utils.formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%)</span>
                        <span>{utils.formatCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{shipping === 0 ? 'Free' : utils.formatCurrency(shipping)}</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{utils.formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('details')}
                  disabled={!paymentMethod}
                  className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment Details
                </button>
              </div>
            )}

            {/* Step 2: Payment Details */}
            {step === 'details' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Details */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerDetails.name}
                        onChange={(e) => handleCustomerDetailsChange('name', e.target.value)}
                        className="input w-full"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerDetails.email}
                        onChange={(e) => handleCustomerDetailsChange('email', e.target.value)}
                        className="input w-full"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerDetails.phone}
                        onChange={(e) => handleCustomerDetailsChange('phone', e.target.value)}
                        className="input w-full"
                        placeholder="+254701234567"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Shipping Address</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerDetails.address.street}
                        onChange={(e) => handleCustomerDetailsChange('address.street', e.target.value)}
                        className="input w-full"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerDetails.address.city}
                          onChange={(e) => handleCustomerDetailsChange('address.city', e.target.value)}
                          className="input w-full"
                          placeholder="Nairobi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={customerDetails.address.zipCode}
                          onChange={(e) => handleCustomerDetailsChange('address.zipCode', e.target.value)}
                          className="input w-full"
                          placeholder="00100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Specific Fields */}
                {paymentMethod === 'mpesa' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">M-Pesa Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        M-Pesa Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="input w-full"
                        placeholder="254701234567"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the phone number registered with M-Pesa
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank-transfer' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Bank Transfer Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Bank Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails(prev => ({...prev, bankName: e.target.value}))}
                          className="input w-full"
                          placeholder="e.g., Equity Bank"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reference Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={bankDetails.referenceNumber}
                          onChange={(e) => setBankDetails(prev => ({...prev, referenceNumber: e.target.value}))}
                          className="input w-full"
                          placeholder="e.g., TXN123456789"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use a unique reference number for this transaction
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep('method')}
                    className="btn btn-outline btn-lg flex-1"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-lg flex-1 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ${utils.formatCurrency(total)}`
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Processing */}
            {step === 'processing' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
                </div>
                
                {paymentMethod === 'mpesa' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Waiting for M-Pesa Payment
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Please check your phone for the M-Pesa STK push notification and enter your PIN to complete the payment.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-900">Payment Details:</p>
                          <p className="text-sm text-blue-700">Phone: {paymentStatus?.phoneNumber}</p>
                          <p className="text-sm text-blue-700">Amount: {utils.formatCurrency(total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank-transfer' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Processing Bank Transfer
                    </h3>
                    <p className="text-gray-600">
                      Please wait while we process your bank transfer details...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
                    <Check className="h-8 w-8 text-success-600" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {paymentMethod === 'mpesa' ? 'Payment Successful!' : 'Order Received!'}
                  </h3>
                  <p className="text-gray-600">
                    {paymentMethod === 'mpesa' 
                      ? 'Your M-Pesa payment has been processed successfully.'
                      : 'We have received your bank transfer details and will verify the payment within 24 hours.'
                    }
                  </p>
                </div>

                {order && (
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-gray-900 mb-3">Order Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Order Number:</span>
                        <span className="font-mono">{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span>{utils.formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="capitalize">{order.paymentMethod.replace('-', ' ')}</span>
                      </div>
                      {paymentStatus?.transactionId && (
                        <div className="flex justify-between">
                          <span>Transaction ID:</span>
                          <span className="font-mono">{paymentStatus.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank-transfer' && paymentStatus && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Bank Transfer Instructions
                    </h4>
                    <div className="space-y-3 text-sm">
                      {paymentStatus.bankDetails && Object.entries(paymentStatus.bankDetails).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="capitalize text-blue-700">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-blue-900">{value}</span>
                            <button
                              onClick={() => copyToClipboard(value)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="btn btn-primary btn-lg w-full"
                >
                  Continue Shopping
                </button>
              </div>
            )}

            {/* Step 5: Error */}
            {step === 'error' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-danger-600" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
                  <p className="text-gray-600">
                    We couldn't process your payment. Please try again or use a different payment method.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('method')}
                    className="btn btn-outline btn-lg flex-1"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="btn btn-primary btn-lg flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentModal;