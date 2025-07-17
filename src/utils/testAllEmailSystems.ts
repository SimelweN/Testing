import { supabase } from "../lib/supabase";

export async function testAllEmailSystems(email: string) {
  console.log(
    "🎯 TESTING ALL EMAIL SYSTEMS - Verifying beautiful HTML styling",
  );

  const results: Array<{ system: string; success: boolean; error?: string }> =
    [];

  // Test 1: Direct Supabase function call
  try {
    console.log("📧 Testing: Direct Supabase send-email function");
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Direct Supabase Test - ReBooked Solutions</title>
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
    .link { color: #3ab26f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Direct Supabase Test</h1>
    </div>
    
    <h2>System Test #1</h2>
    <p>This email was sent directly through the Supabase send-email function using beautiful HTML styling.</p>
    
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

    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject:
          "✅ TEST #1: Direct Supabase Function - Beautiful HTML Styling",
        html: html,
        text: "Direct Supabase Test\n\nThis email was sent directly through the Supabase send-email function using beautiful HTML styling.\n\nReBooked Solutions",
      },
    });

    if (error) {
      results.push({
        system: "Direct Supabase Function",
        success: false,
        error: error.message,
      });
    } else {
      results.push({ system: "Direct Supabase Function", success: true });
    }

    // Wait 2 seconds between emails
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    results.push({
      system: "Direct Supabase Function",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Updated EmailTester component approach
  try {
    console.log("📧 Testing: Updated EmailTester component approach");
    const { sendDirectStyledTestEmail } = await import("./testNewEmailStyling");
    const result = await sendDirectStyledTestEmail(email);
    results.push({
      system: "Updated EmailTester Component",
      success: result.success,
      error: result.success ? undefined : result.error?.message,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    results.push({
      system: "Updated EmailTester Component",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Final email test function
  try {
    console.log("📧 Testing: Final email test function");
    const { runFinalEmailTest } = await import("./finalEmailTest");
    const result = await runFinalEmailTest(email);
    results.push({
      system: "Final Email Test Function",
      success: result.success,
      error: result.success ? undefined : result.error?.message,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    results.push({
      system: "Final Email Test Function",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n📊 ALL EMAIL SYSTEMS TEST RESULTS:`);
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log(`\n❌ Failed systems:`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.system}: ${r.error}`);
      });
  } else {
    console.log(
      `\n🎉 ALL EMAIL SYSTEMS ARE WORKING WITH BEAUTIFUL HTML STYLING!`,
    );
  }

  return {
    success: failed === 0,
    results,
    summary: {
      total: results.length,
      successful,
      failed,
    },
  };
}
