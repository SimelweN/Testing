# Enhanced Email Service Setup

## Overview

This email service provides a comprehensive solution for sending emails through Supabase Edge Functions with:

- ✅ Professional email templates
- ✅ Type-safe TypeScript interfaces
- ✅ Rate limiting and security features
- ✅ CORS support
- ✅ Error handling and logging
- ✅ Template system with customizable content
- ✅ Frontend service wrapper

## Setup Instructions

### 1. Configure Environment Variables

Set your Brevo SMTP credentials as Supabase secrets:

```bash
# Required: Your Brevo SMTP API key
supabase secrets set BREVO_SMTP_KEY="your_brevo_smtp_key_here"

# Optional: Custom SMTP user (defaults to 8e237b002@smtp-brevo.com)
supabase secrets set BREVO_SMTP_USER="your_smtp_user@smtp-brevo.com"

# Optional: Custom default from email
supabase secrets set DEFAULT_FROM_EMAIL='"Your Company" <noreply@yourcompany.com>'
```

### 2. Deploy the Edge Function

```bash
supabase functions deploy send-email
```

### 3. Frontend Usage Examples

#### Basic Email Sending

```typescript
import { emailService, EMAIL_TEMPLATES } from "../services/emailService";

// Send a simple email
const response = await emailService.sendEmail({
  to: "customer@example.com",
  subject: "Welcome to our service!",
  html: "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  text: "Welcome! Thank you for joining us.",
});

console.log("Email sent:", response.messageId);
```

#### Using Templates

```typescript
// Send order confirmation
await emailService.sendOrderConfirmation("customer@example.com", {
  orderNumber: "ORD-12345",
  customerName: "John Doe",
  items: [
    { name: "Physics Textbook", quantity: 1, price: 299.99 },
    { name: "Chemistry Lab Manual", quantity: 1, price: 150.0 },
  ],
  total: "449.99",
  estimatedDelivery: "March 15, 2024",
});

// Send welcome email
await emailService.sendWelcomeEmail("newuser@example.com", {
  userName: "John Doe",
  loginUrl: "https://yourapp.com/login",
});

// Send password reset
await emailService.sendPasswordResetEmail("user@example.com", {
  userName: "John Doe",
  resetUrl: "https://yourapp.com/reset?token=abc123",
  expiryTime: "1 hour",
});

// Send shipping notification
await emailService.sendShippingNotification("customer@example.com", {
  customerName: "John Doe",
  orderNumber: "ORD-12345",
  trackingNumber: "TR123456789",
  carrier: "CourierGuy",
  estimatedDelivery: "March 20, 2024",
});
```

#### Custom Template Usage

```typescript
await emailService.sendTemplateEmail(
  "admin@yourcompany.com",
  EMAIL_TEMPLATES.CONTACT_FORM,
  {
    name: "Jane Smith",
    email: "jane@example.com",
    subject: "Product Inquiry",
    message: "I have a question about your textbook pricing.",
    timestamp: new Date().toLocaleString(),
  },
);
```

#### Multiple Recipients

```typescript
await emailService.sendEmail({
  to: ["user1@example.com", "user2@example.com", "user3@example.com"],
  subject: "System Maintenance Notice",
  html: "<h2>Scheduled Maintenance</h2><p>Our system will be down for maintenance...</p>",
});
```

#### With Attachments

```typescript
await emailService.sendEmail({
  to: "customer@example.com",
  subject: "Invoice Attached",
  html: "<p>Please find your invoice attached.</p>",
  attachments: [
    {
      filename: "invoice.pdf",
      content: "base64-encoded-pdf-content",
      contentType: "application/pdf",
      encoding: "base64",
    },
  ],
});
```

### 4. React Component Example

```typescript
import React, { useState } from 'react';
import { useEmailService } from '../services/emailService';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

export function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const emailService = useEmailService();
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    try {
      await emailService.sendContactFormNotification('admin@rebookedsolutions.co.za', {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
        timestamp: new Date().toLocaleString()
      });

      toast({
        title: 'Message sent!',
        description: 'We\'ll get back to you soon.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
```

## Available Email Templates

1. **ORDER_CONFIRMATION** - For order confirmations with item details
2. **WELCOME** - Welcome emails for new users
3. **PASSWORD_RESET** - Password reset emails with secure links
4. **SHIPPING_NOTIFICATION** - Shipping updates with tracking info
5. **CONTACT_FORM** - Contact form submissions to admin
6. **BOOKING_CONFIRMATION** - Booking confirmations with details

## Security Features

- **Rate Limiting**: 10 emails per minute per IP/email combination
- **Input Validation**: Email format and required field validation
- **Content Sanitization**: HTML content is sanitized to prevent XSS
- **CORS Protection**: Proper CORS headers for security
- **Error Logging**: Comprehensive error logging without sensitive data

## Error Handling

The service handles various error scenarios:

- Invalid email formats
- Missing required fields
- SMTP connection failures
- Rate limit exceeded
- Template not found
- Network timeouts

All errors are properly logged and return structured error responses.

## Rate Limiting

- **Limit**: 10 emails per minute
- **Scope**: Per IP address and destination email combination
- **Response**: HTTP 429 with retry-after header
- **Reset**: Automatic reset after 1 minute

## Monitoring

Check Supabase Function logs for:

- Successful email sends with message IDs
- Failed attempts with error details
- Rate limiting events
- SMTP connection status

## Customization

### Adding New Templates

1. Add template name to `EMAIL_TEMPLATES` constant
2. Add template function to `email-templates.ts`
3. Add convenience method to `EmailService` class
4. Update TypeScript types as needed

### Modifying Existing Templates

Edit the template functions in `supabase/functions/_shared/email-templates.ts` to customize:

- HTML structure and styling
- Brand colors and fonts
- Content layout
- Dynamic data handling

The templates use inline CSS for maximum email client compatibility.
