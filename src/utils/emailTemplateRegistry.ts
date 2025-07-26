import { EmailTemplate, createEmailTemplate, EMAIL_STYLES, EMAIL_FOOTER } from './emailStyles';

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ORDER RELATED EMAILS
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    description: 'Sent to buyer after successful payment',
    category: 'orders',
    requiredFields: ['customerName', 'orderNumber', 'items', 'total'],
    defaultData: {
      customerName: 'John Doe',
      orderNumber: 'ORD-12345',
      items: [
        { name: 'Physics Textbook Grade 12', quantity: 1, price: 250 },
        { name: 'Mathematics Study Guide', quantity: 1, price: 180 }
      ],
      total: '430.00',
      estimatedDelivery: '3-5 business days'
    },
    generator: (data) => ({
      subject: `Order Confirmation - ${data.orderNumber} - ReBooked Marketplace`,
      html: createEmailTemplate(
        {
          title: 'Order Confirmation - ReBooked Marketplace',
          headerText: '🎉 Order Confirmed!',
          headerSubtext: `Thank you for your purchase, ${data.customerName}!`
        },
        `
        <h2>Order #${data.orderNumber}</h2>
        <p>Your order has been confirmed and is being processed.</p>
        
        <h3>Order Details:</h3>
        ${data.items.map((item: any) => `
          <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <strong>${item.name}</strong><br>
            Quantity: ${item.quantity} × R${item.price}<br>
            Subtotal: R${(item.quantity * item.price).toFixed(2)}
          </div>
        `).join('')}
        
        <div class="total">
          <p>Total: R${data.total}</p>
        </div>
        
        ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
        
        <p>We'll send you another email when your order ships with tracking information.</p>
        
        <a href="https://rebookedsolutions.co.za/orders/${data.orderNumber}" class="btn">Track Your Order</a>
        `
      ),
      text: `Order Confirmed!\n\nThank you for your purchase, ${data.customerName}!\n\nOrder #${data.orderNumber}\n\nTotal: R${data.total}\n\nWe'll send you tracking information when your order ships.`
    })
  },

  {
    id: 'payment-confirmation-receipt',
    name: 'Payment Confirmation Receipt',
    description: 'Custom receipt with detailed next steps after payment',
    category: 'orders',
    requiredFields: ['customerName', 'orderId', 'bookTitle', 'totalPaid'],
    defaultData: {
      customerName: 'Jane Smith',
      orderId: 'ORD-67890',
      bookTitle: 'Chemistry Textbook Grade 11',
      totalPaid: 320.00,
      deliveryMethod: 'Standard Delivery',
      paymentReference: 'PAY-ABC123'
    },
    generator: (data) => ({
      subject: '🎉 Payment Confirmed - Your Custom Receipt from ReBooked Marketplace',
      html: createEmailTemplate(
        {
          title: 'Payment Confirmed - ReBooked Marketplace',
          headerText: '🎉 Payment Confirmed!',
          headerSubtext: 'Your custom receipt from ReBooked Marketplace'
        },
        `
        <div class="info-box-success">
          <h2 style="margin: 0; color: #10b981;">✅ Payment Successfully Processed</h2>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Thank you for your purchase! Your order is now being processed.</p>
        </div>

        <div class="info-box">
          <h3 style="margin-top: 0;">📋 Order Summary</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Payment Reference:</strong> ${data.paymentReference}</p>
          <p><strong>Book:</strong> ${data.bookTitle}</p>
          <p><strong>Delivery Method:</strong> ${data.deliveryMethod}</p>
          <div class="total">
            <p>Total Paid: R${data.totalPaid.toFixed(2)}</p>
          </div>
        </div>

        <div class="info-box">
          <h3 style="margin-top: 0;">📦 What Happens Next? (Step-by-Step)</h3>
          <p><strong>We know waiting can be nerve-wracking, so here's exactly what happens:</strong></p>
          
          <div class="timeline-step">
            <div class="step-number">1</div>
            <div>
              <h4 style="margin: 0 0 5px 0;">Seller Notification (Right Now)</h4>
              <p style="margin: 0; font-size: 14px; color: #666;">The seller has been automatically notified of your order and payment. They can see all order details in their dashboard.</p>
            </div>
          </div>

          <div class="timeline-step">
            <div class="step-number">2</div>
            <div>
              <h4 style="margin: 0 0 5px 0;">Seller Commitment (Within 48 Hours)</h4>
              <p style="margin: 0; font-size: 14px; color: #666;">The seller has exactly <strong>48 hours</strong> to commit to fulfilling your order. If they don't respond, you'll get an automatic full refund.</p>
            </div>
          </div>

          <div class="timeline-step">
            <div class="step-number">3</div>
            <div>
              <h4 style="margin: 0 0 5px 0;">Courier Pickup (Same Day as Commitment)</h4>
              <p style="margin: 0; font-size: 14px; color: #666;">Once the seller commits, we immediately arrange courier pickup from their location. No action required from you!</p>
            </div>
          </div>

          <div class="timeline-step">
            <div class="step-number">4</div>
            <div>
              <h4 style="margin: 0 0 5px 0;">Shipping & Tracking (1-2 Days After Pickup)</h4>
              <p style="margin: 0; font-size: 14px; color: #666;">You'll receive tracking details via email and SMS as soon as the book is collected and in transit to you.</p>
            </div>
          </div>

          <div class="timeline-step">
            <div class="step-number">5</div>
            <div>
              <h4 style="margin: 0 0 5px 0;">Delivery (2-3 Business Days)</h4>
              <p style="margin: 0; font-size: 14px; color: #666;">Your book will be delivered to your address. Expected delivery: <strong>2-3 business days</strong> after pickup.</p>
            </div>
          </div>
        </div>

        <div class="info-box-warning">
          <h3 style="margin-top: 0; color: #92400e;">⏰ Important Timeline</h3>
          <p style="margin: 0; color: #92400e;"><strong>Total Expected Timeframe:</strong> 3-5 business days from now to delivery</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">We'll update you at every step via email and SMS notifications.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rebookedsolutions.co.za/orders/${data.orderId}" class="btn">Track Your Order Live</a>
        </div>
        `
      ),
      text: `Payment Confirmed - Your Custom Receipt\n\n✅ Your payment has been successfully processed!\n\nORDER SUMMARY:\nOrder ID: ${data.orderId}\nTotal Paid: R${data.totalPaid.toFixed(2)}\n\nWHAT HAPPENS NEXT:\n1. Seller gets notified\n2. Seller has 48 hours to commit\n3. Courier pickup arranged\n4. Tracking details sent\n5. Delivery in 2-3 business days`
    })
  },

  {
    id: 'order-declined',
    name: 'Order Declined Notification',
    description: 'Sent to buyer when seller declines their order',
    category: 'orders',
    requiredFields: ['customerName', 'orderId', 'reason', 'totalAmount'],
    defaultData: {
      customerName: 'Mike Johnson',
      orderId: 'ORD-54321',
      reason: 'Book no longer available',
      totalAmount: 280.00,
      refundStatus: 'processed',
      refundReference: 'REF-ABC789'
    },
    generator: (data) => ({
      subject: 'Order Declined - Refund Processed - ReBooked Marketplace',
      html: createEmailTemplate(
        {
          title: 'Order Declined - Refund Processed',
          headerType: 'error',
          headerText: '❌ Order Declined'
        },
        `
        <p>Hello ${data.customerName},</p>
        <p>We're sorry to inform you that your order has been declined by the seller.</p>

        <div class="info-box-error">
          <h3>📋 Order Details</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Amount:</strong> R${data.totalAmount.toFixed(2)}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>

        <div class="info-box-success">
          <h3>💰 Refund Information</h3>
          <p><strong>Refund Status:</strong> ${data.refundStatus}</p>
          <p><strong>Refund Reference:</strong> ${data.refundReference}</p>
          <p><strong>Processing Time:</strong> 3-5 business days</p>
          <p><strong>✅ Your refund has been successfully processed.</strong></p>
        </div>

        <p>We apologize for any inconvenience. Please feel free to browse our marketplace for similar books from other sellers.</p>

        <a href="https://rebookedsolutions.co.za/books" class="btn">Browse Books</a>
        `
      ),
      text: `Order Declined\n\nHello ${data.customerName},\n\nYour order has been declined by the seller.\n\nOrder ID: ${data.orderId}\nAmount: R${data.totalAmount.toFixed(2)}\nReason: ${data.reason}\n\nYour refund has been processed and will appear in your account within 3-5 business days.`
    })
  },

  // AUTHENTICATION EMAILS
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    description: 'Welcome email for new users',
    category: 'auth',
    requiredFields: ['userName'],
    defaultData: {
      userName: 'Alex Parker',
      loginUrl: 'https://rebookedsolutions.co.za/profile'
    },
    generator: (data) => ({
      subject: 'Welcome to ReBooked Marketplace! 📚',
      html: createEmailTemplate(
        {
          title: 'Welcome to ReBooked Marketplace',
          headerText: '🎉 Welcome to ReBooked Marketplace!',
          headerSubtext: `Hello ${data.userName}!`
        },
        `
        <p>Welcome to ReBooked Marketplace - your marketplace for buying and selling textbooks.</p>
        
        <div class="info-box">
          <h3>Here's what you can do:</h3>
          <ul>
            <li>Browse thousands of affordable textbooks</li>
            <li>Sell your used textbooks to other students</li>
            <li>Connect with students from universities across South Africa</li>
            <li>Track your orders and manage your account</li>
          </ul>
        </div>
        
        <p>Ready to get started?</p>
        ${data.loginUrl ? `<a href="${data.loginUrl}" class="btn">Login to Your Account</a>` : ''}
        
        <p>If you have any questions, feel free to contact our support team.</p>
        `
      ),
      text: `Welcome to ReBooked Marketplace!\n\nHello ${data.userName}!\n\nYou can now browse textbooks, sell your books, and connect with students across South Africa.\n\nFor questions, contact support@rebookedsolutions.co.za`
    })
  },

  {
    id: 'email-verification',
    name: 'Email Verification',
    description: 'Email verification for new accounts',
    category: 'auth',
    requiredFields: ['userName', 'verificationUrl'],
    defaultData: {
      userName: 'Sarah Wilson',
      verificationUrl: 'https://rebookedsolutions.co.za/verify?token=abc123',
      expiryTime: '24 hours'
    },
    generator: (data) => ({
      subject: 'Verify Your Email Address - ReBooked Marketplace',
      html: createEmailTemplate(
        {
          title: 'Verify Your Email - ReBooked Marketplace',
          headerText: '📧 Verify Your Email Address'
        },
        `
        <h2>Hello ${data.userName}!</h2>
        <p>Welcome to ReBooked Marketplace! To complete your registration and start buying and selling textbooks, please verify your email address.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" class="btn">Verify My Email Address</a>
        </div>

        <p><strong>This verification link will expire in ${data.expiryTime || '24 hours'}.</strong></p>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
          ${data.verificationUrl}
        </p>

        <p style="font-size: 14px; color: #666;">
          If you didn't create an account with ReBooked Marketplace, please ignore this email.
        </p>
        `
      ),
      text: `Verify Your Email Address\n\nHello ${data.userName}!\n\nPlease verify your email: ${data.verificationUrl}\n\nThis link expires in ${data.expiryTime || '24 hours'}.`
    })
  },

  {
    id: 'password-reset',
    name: 'Password Reset',
    description: 'Password reset email',
    category: 'auth',
    requiredFields: ['resetUrl'],
    defaultData: {
      userName: 'David Brown',
      resetUrl: 'https://rebookedsolutions.co.za/reset-password?token=xyz789'
    },
    generator: (data) => ({
      subject: 'Password Reset Request - ReBooked Marketplace',
      html: createEmailTemplate(
        {
          title: 'Password Reset - ReBooked Marketplace',
          headerText: '🔐 Password Reset Request'
        },
        `
        <h2>Hello ${data.userName || 'User'}!</h2>
        <p>We received a request to reset your password for your ReBooked Marketplace account.</p>
        
        <div class="info-box">
          <h3>Reset Your Password</h3>
          <p>Click the button below to reset your password. This link will expire in 24 hours.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" class="btn">Reset Password</a>
        </div>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        `
      ),
      text: `Password Reset Request\n\nHello ${data.userName || 'User'}!\n\nReset your password: ${data.resetUrl}\n\nThis link expires in 24 hours.`
    })
  },

  // NOTIFICATION EMAILS
  {
    id: 'seller-new-order',
    name: 'New Order Notification (Seller)',
    description: 'Notifies seller of new order requiring commitment',
    category: 'notifications',
    requiredFields: ['sellerName', 'buyerName', 'orderId', 'totalAmount'],
    defaultData: {
      sellerName: 'Emma Davis',
      buyerName: 'Tom Wilson',
      orderId: 'ORD-99999',
      totalAmount: '450.00',
      expiresAt: '48 hours',
      items: [{ name: 'Biology Textbook Grade 12', quantity: 1, price: 450 }]
    },
    generator: (data) => ({
      subject: 'New Order - Action Required - ReBooked Marketplace',
      html: createEmailTemplate(
        {
          title: 'New Order - Action Required',
          headerText: '🔔 New Order Received!',
          headerSubtext: `Hello ${data.sellerName}!`
        },
        `
        <p>Great news! You have received a new order from ${data.buyerName}.</p>

        <div class="info-box">
          <h3>📋 Order Details</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Buyer:</strong> ${data.buyerName}</p>
          <p><strong>Total Amount:</strong> R${data.totalAmount}</p>
          ${data.items ? data.items.map((item: any) => `<p><strong>Item:</strong> ${item.name} (R${item.price})</p>`).join('') : ''}
        </div>

        <div class="info-box-warning">
          <h3>⏰ Action Required</h3>
          <p><strong>You have ${data.expiresAt} to commit to this order.</strong></p>
          <p>If you don't respond within this time, the order will be automatically cancelled and the buyer will be refunded.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rebookedsolutions.co.za/seller/orders/${data.orderId}" class="btn">Review Order & Commit</a>
        </div>
        `
      ),
      text: `New Order - Action Required\n\nHello ${data.sellerName}!\n\nNew order from ${data.buyerName}\nOrder ID: ${data.orderId}\nTotal: R${data.totalAmount}\n\nYou have ${data.expiresAt} to commit. Review at: https://rebookedsolutions.co.za/seller/orders/${data.orderId}`
    })
  },

  // BANKING EMAILS  
  {
    id: 'banking-setup-success',
    name: 'Banking Setup Success',
    description: 'Confirms successful banking setup',
    category: 'banking',
    requiredFields: ['userName', 'subaccountCode'],
    defaultData: {
      userName: 'Lisa Chen',
      subaccountCode: 'ACCT_123456789',
      businessName: 'Lisa\'s Books'
    },
    generator: (data) => ({
      subject: 'Banking Setup Completed - ReBooked Marketplace',
      html: createEmailTemplate(
        {
          title: 'Banking Setup Completed',
          headerText: '🏦 Banking Setup Complete!',
          headerSubtext: `Hello ${data.userName}!`
        },
        `
        <p>Your banking details have been successfully set up on ReBooked Marketplace.</p>

        <div class="info-box-success">
          <h3>✅ Setup Complete</h3>
          <p><strong>Business Name:</strong> ${data.businessName}</p>
          <p><strong>Subaccount Code:</strong> ${data.subaccountCode}</p>
          <p><strong>Commission Rate:</strong> 10% (You keep 90%)</p>
        </div>

        <div class="info-box">
          <h3>💰 How Payments Work</h3>
          <ul>
            <li>Payments are held in escrow until delivery confirmation</li>
            <li>Funds are released to your account within 1-2 business days after delivery</li>
            <li>All transactions are processed securely through Paystack</li>
          </ul>
        </div>

        <p>You can now start selling books and receive payments directly to your bank account!</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rebookedsolutions.co.za/sell" class="btn">Start Selling Books</a>
        </div>
        `
      ),
      text: `Banking Setup Complete!\n\nHello ${data.userName}!\n\nYour banking details are set up.\nSubaccount: ${data.subaccountCode}\n\nYou can now sell books and receive payments to your bank account.`
    })
  }
];

export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter(template => template.category === category);
}

export function getAllTemplateCategories(): string[] {
  return [...new Set(EMAIL_TEMPLATES.map(template => template.category))];
}
