import { supabase } from "../lib/supabase";

export async function testDirectHTMLEmail(email: string) {
  console.log("🎯 Testing DIRECT HTML email (the ONLY correct way)...");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test - ReBooked Solutions</title>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ DIRECT HTML TEST SUCCESS!</h1>
    </div>
    
    <h2>Congratulations!</h2>
    <p>If you're seeing this email with proper ReBooked Solutions styling, it means the DIRECT HTML approach is working correctly!</p>
    
    <p>This email has:</p>
    <ul>
      <li>✅ Light green background (#f3fef7)</li>
      <li>✅ White container with rounded corners</li>
      <li>✅ Green header (#3ab26f)</li>
      <li>✅ Proper typography and spacing</li>
      <li>✅ Professional footer</li>
    </ul>
    
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
DIRECT HTML TEST SUCCESS!

Congratulations!

If you're seeing this email, it means the DIRECT HTML approach is working correctly!

This email has proper ReBooked Solutions styling.

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
          "✅ DIRECT HTML TEST - ReBooked Solutions Styling Verification",
        html: html,
        text: text,
      },
    });

    if (error) {
      console.error("❌ Direct HTML test failed:", error);
      throw error;
    }

    console.log("✅ Direct HTML email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Direct HTML test error:", error);
    return { success: false, error };
  }
}
