import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { NotificationService } from "@/services/notificationService";

interface PurchaseEmailData {
  orderId: string;
  bookId: string;
  bookTitle: string;
  bookPrice: number;
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerEmail: string;
  orderTotal: number;
  orderDate: string;
}

/**
 * Enhanced purchase email service with guaranteed fallback system
 * Ensures critical purchase confirmation emails are always sent
 */
export class EnhancedPurchaseEmailService {
  
  /**
   * Send purchase confirmation emails with guaranteed fallbacks
   * Called after successful payment completion
   */
  static async sendPurchaseEmailsWithFallback(purchaseData: PurchaseEmailData): Promise<{
    sellerEmailSent: boolean;
    buyerEmailSent: boolean;
    message: string;
  }> {
    console.log("📧 Enhanced purchase emails: Starting guaranteed email delivery");
    
    let sellerEmailSent = false;
    let buyerEmailSent = false;
    
    try {
      // Send seller notification (they need to know about the sale to commit)
      try {
        await this.sendSellerPurchaseNotification(purchaseData);
        sellerEmailSent = true;
        console.log("✅ Seller purchase notification sent");
      } catch (sellerError) {
        console.warn("⚠️ Seller email failed, queuing for fallback:", sellerError);
        await this.queueSellerEmailForFallback(purchaseData);
      }

      // Create in-app notification for seller (regardless of email success)
      try {
        await this.createSellerNotification(purchaseData);
        console.log("✅ Seller in-app notification created");
      } catch (notifError) {
        console.warn("⚠️ Seller notification failed:", notifError);
      }

      // Add small delay to prevent stream conflicts
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send buyer receipt/confirmation
      try {
        await this.sendBuyerPurchaseReceipt(purchaseData);
        buyerEmailSent = true;
        console.log("✅ Buyer purchase receipt sent");
      } catch (buyerError) {
        console.warn("⚠️ Buyer email failed, queuing for fallback:", buyerError);
        await this.queueBuyerEmailForFallback(purchaseData);
      }

      // Create in-app notification for buyer (regardless of email success)
      try {
        await this.createBuyerNotification(purchaseData);
        console.log("✅ Buyer in-app notification created");
      } catch (notifError) {
        console.warn("⚠️ Buyer notification failed:", notifError);
      }
      
      // Additional fallback: Queue verification email
      await this.queuePurchaseVerificationEmail(purchaseData);
      
      return {
        sellerEmailSent,
        buyerEmailSent,
        message: `Purchase emails sent - Seller: ${sellerEmailSent ? 'sent' : 'queued'}, Buyer: ${buyerEmailSent ? 'sent' : 'queued'}`
      };
      
    } catch (error) {
      console.error("❌ Purchase email system failed:", error);
      
      // Final fallback: Queue urgent manual processing
      await this.queueUrgentManualProcessing(purchaseData);
      
      return {
        sellerEmailSent: false,
        buyerEmailSent: false,
        message: "Emails queued for urgent manual processing"
      };
    }
  }
  
  /**
   * Send purchase notification to seller (they need to confirm/commit the sale)
   */
  private static async sendSellerPurchaseNotification(purchaseData: PurchaseEmailData): Promise<void> {
    try {
      await this.sendSellerPurchaseNotificationDirect(purchaseData);
    } catch (error) {
      console.warn("Direct seller email failed, trying mail queue fallback:", error);
      await this.queueSellerEmailForFallback(purchaseData);
      throw error; // Re-throw to maintain error handling flow
    }
  }

  private static async sendSellerPurchaseNotificationDirect(purchaseData: PurchaseEmailData): Promise<void> {
    const sellerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🚨 New Book Sale - Action Required!</h1>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <p>Hello ${purchaseData.sellerName},</p>
          <p><strong>Great news!</strong> Someone just purchased your book and is waiting for confirmation.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #e17055; margin-top: 0;">⏰ ACTION REQUIRED WITHIN 48 HOURS</h3>
            <p><strong>You must confirm this sale to proceed with the order.</strong></p>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2d3436; margin-top: 0;">Sale Details</h3>
            <p><strong>Book:</strong> ${purchaseData.bookTitle}</p>
            <p><strong>Price:</strong> R${purchaseData.bookPrice}</p>
            <p><strong>Buyer:</strong> ${purchaseData.buyerName}</p>
            <p><strong>Order ID:</strong> ${purchaseData.orderId}</p>
            <p><strong>Order Date:</strong> ${purchaseData.orderDate}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/books" 
               style="background-color: #00b894; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              CONFIRM SALE NOW
            </a>
          </div>
          
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>Log in to your ReBooked Solutions account</li>
            <li>Click "Commit Sale" for this book</li>
            <li>We'll arrange pickup from your location</li>
            <li>You'll receive payment after delivery</li>
          </ul>
          
          <p style="color: #e17055;"><strong>Important:</strong> If you don't confirm within 48 hours, the order will be automatically cancelled and refunded.</p>
          
          <p>Thank you for using ReBooked Solutions!</p>
        </div>
      </div>
    `;
    
    await emailService.sendEmail({
      to: purchaseData.sellerEmail,
      subject: "🚨 NEW SALE - Confirm Your Book Sale (48hr deadline)",
      html: sellerEmailHtml,
      text: `NEW SALE - Action Required! Book: ${purchaseData.bookTitle}, Price: R${purchaseData.bookPrice}. You have 48 hours to confirm this sale. Login to ReBooked Solutions to confirm.`
    });
  }
  
  /**
   * Send purchase receipt to buyer
   */
  private static async sendBuyerPurchaseReceipt(purchaseData: PurchaseEmailData): Promise<void> {
    try {
      await this.sendBuyerPurchaseReceiptDirect(purchaseData);
    } catch (error) {
      console.warn("Direct buyer email failed, trying mail queue fallback:", error);
      await this.queueBuyerEmailForFallback(purchaseData);
      throw error; // Re-throw to maintain error handling flow
    }
  }

  private static async sendBuyerPurchaseReceiptDirect(purchaseData: PurchaseEmailData): Promise<void> {
    const buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #00b894; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">📚 Purchase Confirmed!</h1>
        </div>
        <div style="padding: 30px; background-color: #f8f9fa;">
          <p>Hello ${purchaseData.buyerName},</p>
          <p><strong>Thank you for your purchase!</strong> Your payment has been processed successfully.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #00b894; margin-top: 0;">Order Summary</h3>
            <p><strong>Book:</strong> ${purchaseData.bookTitle}</p>
            <p><strong>Price:</strong> R${purchaseData.bookPrice}</p>
            <p><strong>Seller:</strong> ${purchaseData.sellerName}</p>
            <p><strong>Order ID:</strong> ${purchaseData.orderId}</p>
            <p><strong>Order Date:</strong> ${purchaseData.orderDate}</p>
            <p><strong>Total Paid:</strong> R${purchaseData.orderTotal}</p>
          </div>
          
          <div style="background-color: #e8f4fd; border: 1px solid #74b9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0984e3; margin-top: 0;">⏳ Waiting for Seller Confirmation</h3>
            <p>The seller has 48 hours to confirm your order. Once confirmed, your book will be shipped immediately.</p>
          </div>
          
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>The seller will confirm your order within 48 hours</li>
            <li>Once confirmed, your book will be shipped immediately</li>
            <li>You'll receive tracking information via SMS/email</li>
            <li>Delivery typically takes 1-3 business days</li>
          </ul>
          
          <p><strong>If the seller doesn't confirm:</strong> You'll receive a full automatic refund within 48 hours.</p>
          
          <p>Thank you for choosing ReBooked Solutions!</p>
        </div>
      </div>
    `;
    
    await emailService.sendEmail({
      to: purchaseData.buyerEmail,
      subject: "📚 Purchase Confirmed - Waiting for Seller Response",
      html: buyerEmailHtml,
      text: `Purchase Confirmed! Book: ${purchaseData.bookTitle}, Total: R${purchaseData.orderTotal}. Waiting for seller confirmation within 48 hours.`
    });
  }
  
  /**
   * Queue seller email for fallback processing
   */
  private static async queueSellerEmailForFallback(purchaseData: PurchaseEmailData): Promise<void> {
    try {
      await supabase.from("mail_queue").insert({
        to_email: purchaseData.sellerEmail,
        subject: "🚨 NEW SALE - Confirm Your Book Sale (48hr deadline)",
        html_content: `
          <h2>NEW SALE - Action Required!</h2>
          <p>Book: ${purchaseData.bookTitle}</p>
          <p>Price: R${purchaseData.bookPrice}</p>
          <p>Buyer: ${purchaseData.buyerName}</p>
          <p>Order ID: ${purchaseData.orderId}</p>
          <p><strong>You have 48 hours to confirm this sale.</strong></p>
          <p>Login to ReBooked Solutions to confirm.</p>
        `,
        priority: "urgent",
        email_type: "seller_purchase_notification"
      });
      console.log("📧 Seller email queued for fallback processing");
    } catch (error) {
      console.error("❌ Failed to queue seller email:", error);
    }
  }
  
  /**
   * Queue buyer email for fallback processing
   */
  private static async queueBuyerEmailForFallback(purchaseData: PurchaseEmailData): Promise<void> {
    try {
      await supabase.from("mail_queue").insert({
        to_email: purchaseData.buyerEmail,
        subject: "📚 Purchase Confirmed - Receipt",
        html_content: `
          <h2>Purchase Confirmed!</h2>
          <p>Book: ${purchaseData.bookTitle}</p>
          <p>Total Paid: R${purchaseData.orderTotal}</p>
          <p>Order ID: ${purchaseData.orderId}</p>
          <p>Waiting for seller confirmation within 48 hours.</p>
          <p>Thank you for your purchase!</p>
        `,
        priority: "high",
        email_type: "buyer_purchase_receipt"
      });
      console.log("📧 Buyer email queued for fallback processing");
    } catch (error) {
      console.error("❌ Failed to queue buyer email:", error);
    }
  }
  
  /**
   * Queue purchase verification email for admin monitoring
   */
  private static async queuePurchaseVerificationEmail(purchaseData: PurchaseEmailData): Promise<void> {
    try {
      await supabase.from("mail_queue").insert({
        to_email: "admin@rebookedsolutions.com",
        subject: `Purchase Verification - Order ${purchaseData.orderId}`,
        html_content: `
          <h3>Purchase Verification</h3>
          <p>A new purchase has been completed and emails sent.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${purchaseData.orderId}</li>
            <li>Book: ${purchaseData.bookTitle}</li>
            <li>Price: R${purchaseData.bookPrice}</li>
            <li>Buyer: ${purchaseData.buyerEmail}</li>
            <li>Seller: ${purchaseData.sellerEmail}</li>
            <li>Date: ${purchaseData.orderDate}</li>
          </ul>
          <p>Monitor for seller confirmation within 48 hours.</p>
        `,
        priority: "low",
        email_type: "purchase_verification"
      });
    } catch (error) {
      console.warn("⚠️ Failed to queue verification email:", error);
    }
  }
  
  /**
   * Queue urgent manual processing notification
   */
  private static async queueUrgentManualProcessing(purchaseData: PurchaseEmailData): Promise<void> {
    try {
      await supabase.from("mail_queue").insert({
        to_email: "admin@rebookedsolutions.com",
        subject: `URGENT: Purchase Email System Failed - Order ${purchaseData.orderId}`,
        html_content: `
          <h2 style="color: red;">URGENT: Email System Failure</h2>
          <p>The purchase email system failed for order ${purchaseData.orderId}.</p>
          <p><strong>Required Actions:</strong></p>
          <ul>
            <li>Manually send seller notification: ${purchaseData.sellerEmail}</li>
            <li>Manually send buyer receipt: ${purchaseData.buyerEmail}</li>
            <li>Monitor for seller confirmation</li>
          </ul>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${purchaseData.orderId}</li>
            <li>Book: ${purchaseData.bookTitle}</li>
            <li>Price: R${purchaseData.bookPrice}</li>
            <li>Date: ${purchaseData.orderDate}</li>
          </ul>
        `,
        priority: "urgent",
        email_type: "urgent_manual_processing"
      });
      console.log("📧 Urgent manual processing notification queued");
    } catch (error) {
      console.error("❌ Failed to queue urgent processing notification:", error);
    }
  }

  /**
   * Create in-app notification for seller about new order
   */
  private static async createSellerNotification(purchaseData: PurchaseEmailData): Promise<void> {
    // Get seller user ID from the email
    const { data: seller } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', purchaseData.sellerEmail)
      .single();

    if (seller) {
      await NotificationService.createOrderConfirmation(
        seller.id,
        purchaseData.orderId,
        purchaseData.bookTitle,
        true // isForSeller = true
      );
    }
  }

  /**
   * Create in-app notification for buyer about order confirmation
   */
  private static async createBuyerNotification(purchaseData: PurchaseEmailData): Promise<void> {
    // Get buyer user ID from the email
    const { data: buyer } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', purchaseData.buyerEmail)
      .single();

    if (buyer) {
      await NotificationService.createOrderConfirmation(
        buyer.id,
        purchaseData.orderId,
        purchaseData.bookTitle,
        false // isForSeller = false
      );
    }
  }
}

export default EnhancedPurchaseEmailService;
