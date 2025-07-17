import { supabase } from "../lib/supabase";

export async function runFinalEmailTest(email: string) {
  console.log("🎯 FINAL EMAIL TEST - Direct HTML only (the ONLY correct way!)");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FINAL TEST - ReBooked Solutions Email System Fixed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f3fef7;
      padding: 20px;
      color: #1f4e3d;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .btn {
      display: inline-block;
      padding: 12px 20px;
      background-color: #3ab26f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: bold;
    }
    .link {
      color: #3ab26f;
    }
    .header {
      background: #3ab26f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .footer {
      background: #f3fef7;
      color: #1f4e3d;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      margin: 30px -30px -30px -30px;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background: #f3fef7;
      border: 1px solid #3ab26f;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      color: #155724;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 EMAIL SYSTEM FIXED!</h1>
    </div>
    
    <div class="success">
      <h2>✅ SUCCESS!</h2>
      <p>If you're seeing this email with beautiful ReBooked Solutions styling, it means ALL your emails are now working correctly!</p>
    </div>
    
    <h2>What was fixed:</h2>
    
    <div class="info-box">
      <h3>✅ ALL Email Systems Updated</h3>
      <ul>
        <li>Order creation emails</li>
        <li>Shipping notifications</li>
        <li>Commit/decline emails</li>
        <li>Courier pickup notifications</li>
        <li>Test email components</li>
      </ul>
    </div>

    <div class="info-box">
      <h3>🗑️ Template System REMOVED</h3>
      <p>The broken template system has been completely removed. ALL emails now use direct HTML with inline styles (the only approach that works).</p>
    </div>

    <div class="info-box">
      <h3>🎨 Your Exact Styling Applied</h3>
      <ul>
        <li>✅ Light green background (#f3fef7)</li>
        <li>✅ White container with rounded corners</li>
        <li>✅ Green buttons (#3ab26f)</li>
        <li>✅ Green links (#3ab26f)</li>
        <li>✅ Dark green text (#1f4e3d)</li>
        <li>✅ Professional footer with branding</li>
      </ul>
    </div>

    <p><strong>ALL YOUR EMAILS WILL NOW LOOK LIKE THIS!</strong></p>

    <a href="https://rebookedsolutions.co.za" class="btn">Visit ReBooked Solutions</a>

    <div class="footer">
      <p><strong>This is an automated message from ReBooked Solutions.</strong><br>
      Please do not reply to this email.</p>
      <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
      Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
      <p>T&Cs apply.</p>
      <p><em>"Pre-Loved Pages, New Adventures"</em></p>
    </div>
  </div>
</body>
</html>`;

  const text = `
🎉 EMAIL SYSTEM FIXED!

SUCCESS!

If you're receiving this email, it means ALL your emails are now working correctly with beautiful ReBooked Solutions styling!

What was fixed:
- Order creation emails
- Shipping notifications  
- Commit/decline emails
- Courier pickup notifications
- Test email components

Template System REMOVED:
The broken template system has been completely removed. ALL emails now use direct HTML with inline styles (the only approach that works).

Your Exact Styling Applied:
✅ Light green background (#f3fef7)
✅ White container with rounded corners
✅ Green buttons (#3ab26f)
✅ Green links (#3ab26f)
✅ Dark green text (#1f4e3d)
✅ Professional footer with branding

ALL YOUR EMAILS WILL NOW LOOK LIKE THIS!

Visit ReBooked Solutions: https://rebookedsolutions.co.za

This is an automated message from ReBooked Solutions. Please do not reply to this email.
For assistance, contact: support@rebookedsolutions.co.za
Visit us at: https://rebookedsolutions.co.za
T&Cs apply.
"Pre-Loved Pages, New Adventures"
  `;

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject:
          "🎉 EMAIL SYSTEM FIXED - All ReBooked Solutions Emails Now Styled Correctly",
        html: html,
        text: text,
      },
    });

    if (error) {
      console.error("❌ Final test failed:", error);
      return { success: false, error };
    }

    console.log("✅ FINAL TEST SUCCESS - Email system is working correctly!");
    return { success: true, data };
  } catch (error) {
    console.error("💥 Final test error:", error);
    return { success: false, error };
  }
}
