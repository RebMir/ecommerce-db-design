const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { validateMpesaPayment, validateBankTransfer } = require('../middleware/validation');

// POST /api/payments/mpesa - Simulate M-Pesa STK Push
router.post('/mpesa', validateMpesaPayment, async (req, res) => {
  try {
    const { phoneNumber, amount, orderId } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this order'
      });
    }

    // Simulate M-Pesa STK Push (Safaricom Daraja API format)
    // In a real implementation, you would integrate with Safaricom Daraja API
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const merchantRequestId = `MR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update order with M-Pesa details
    order.paymentDetails.mpesa = {
      phoneNumber: phoneNumber,
      checkoutRequestId: checkoutRequestId,
      transactionId: null // Will be updated when payment is confirmed
    };
    order.paymentStatus = 'pending';
    await order.save();

    // Simulate STK Push response
    const stkPushResponse = {
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing"
    };

    // Simulate payment processing (in real app, this would be handled by M-Pesa callback)
    setTimeout(async () => {
      try {
        // Simulate random success/failure (90% success rate)
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          const transactionId = `MP${Date.now()}${Math.floor(Math.random() * 1000)}`;
          order.paymentDetails.mpesa.transactionId = transactionId;
          order.paymentStatus = 'completed';
          order.status = 'confirmed';
          await order.save();
          
          console.log(`M-Pesa payment completed for order ${order.orderNumber}`);
        } else {
          order.paymentStatus = 'failed';
          await order.save();
          console.log(`M-Pesa payment failed for order ${order.orderNumber}`);
        }
      } catch (error) {
        console.error('Error processing M-Pesa callback:', error);
      }
    }, 5000); // Simulate 5-second processing time

    res.json({
      success: true,
      message: 'STK Push sent successfully',
      data: {
        checkoutRequestId,
        merchantRequestId,
        orderId: order._id,
        amount,
        phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3'), // Mask middle digits
        estimatedProcessingTime: '30 seconds'
      }
    });

  } catch (error) {
    console.error('M-Pesa payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing M-Pesa payment'
    });
  }
});

// GET /api/payments/mpesa/status/:checkoutRequestId - Check M-Pesa payment status
router.get('/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    const order = await Order.findOne({
      'paymentDetails.mpesa.checkoutRequestId': checkoutRequestId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    let status = 'pending';
    let message = 'Payment is being processed';

    if (order.paymentStatus === 'completed') {
      status = 'success';
      message = 'Payment completed successfully';
    } else if (order.paymentStatus === 'failed') {
      status = 'failed';
      message = 'Payment failed. Please try again.';
    }

    res.json({
      success: true,
      data: {
        checkoutRequestId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        status,
        message,
        transactionId: order.paymentDetails.mpesa.transactionId || null,
        amount: order.totalAmount
      }
    });

  } catch (error) {
    console.error('Error checking M-Pesa status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking payment status'
    });
  }
});

// POST /api/payments/bank - Process bank transfer
router.post('/bank', validateBankTransfer, async (req, res) => {
  try {
    const { orderId, referenceNumber, bankName } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this order'
      });
    }

    // Bank account details (in real app, this would be from environment variables)
    const bankDetails = {
      accountName: 'E-Commerce Store Ltd',
      accountNumber: '1234567890',
      bankName: 'ABC Bank',
      branch: 'Main Branch',
      swiftCode: 'ABCBKENA',
      routingNumber: '123456789'
    };

    // Update order with bank transfer details
    order.paymentDetails.bankTransfer = {
      referenceNumber: referenceNumber,
      bankName: bankName,
      accountNumber: bankDetails.accountNumber
    };
    order.paymentStatus = 'pending';
    order.status = 'pending';
    await order.save();

    res.json({
      success: true,
      message: 'Bank transfer details recorded. Please complete the transfer.',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        referenceNumber,
        bankDetails,
        instructions: [
          'Transfer the exact amount to the bank account provided',
          'Use the reference number in the transfer description',
          'Payment will be verified within 24 hours',
          'You will receive a confirmation email once payment is verified'
        ]
      }
    });

  } catch (error) {
    console.error('Bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bank transfer'
    });
  }
});

// POST /api/payments/bank/verify - Verify bank transfer (admin endpoint)
router.post('/bank/verify', async (req, res) => {
  try {
    const { orderId, isVerified, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (isVerified) {
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
    } else {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
    }

    if (notes) {
      order.notes.admin = notes;
    }

    await order.save();

    res.json({
      success: true,
      message: `Bank transfer ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status
      }
    });

  } catch (error) {
    console.error('Bank verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying bank transfer'
    });
  }
});

module.exports = router;