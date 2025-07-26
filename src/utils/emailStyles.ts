// CENTRALIZED EMAIL STYLING SYSTEM FOR REBOOKED MARKETPLACE
// All email templates should use these standardized styles

export const EMAIL_STYLES = `
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
  .header-error {
    background: #dc2626;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 10px 10px 0 0;
    margin: -30px -30px 20px -30px;
  }
  .header-warning {
    background: #f59e0b;
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
  .info-box-error {
    background: #fef2f2;
    border: 1px solid #dc2626;
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .info-box-warning {
    background: #fffbeb;
    border: 1px solid #f59e0b;
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .info-box-success {
    background: #f0fdf4;
    border: 1px solid #10b981;
    padding: 15px;
    border-radius: 5px;
    margin: 15px 0;
  }
  .total {
    font-weight: bold;
    font-size: 18px;
    color: #3ab26f;
  }
  .timeline-step {
    display: flex;
    align-items: flex-start;
    margin: 15px 0;
    padding: 10px 0;
    border-bottom: 1px dashed #e5e7eb;
  }
  .timeline-step:last-child {
    border-bottom: none;
  }
  .step-number {
    background: #3ab26f;
    color: white;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
    margin-right: 15px;
    flex-shrink: 0;
  }
</style>
`;

export const EMAIL_FOOTER = `
<div class="footer">
  <p><strong>This is an automated message from ReBooked Marketplace.</strong><br>
  Please do not reply to this email.</p>
  <p>For assistance, contact: <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a><br>
  Visit us at: <a href="https://rebookedsolutions.co.za" class="link">https://rebookedsolutions.co.za</a></p>
  <p>T&Cs apply. <em>"Pre-Loved Pages, New Adventures"</em></p>
</div>
`;

export interface EmailTemplateData {
  title: string;
  headerType?: 'default' | 'error' | 'warning';
  headerText: string;
  headerSubtext?: string;
}

export function createEmailTemplate(
  data: EmailTemplateData,
  bodyContent: string,
  includeFooter: boolean = true
): string {
  const headerClass = data.headerType === 'error' ? 'header-error' : 
                     data.headerType === 'warning' ? 'header-warning' : 'header';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.title}</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="container">
    <div class="${headerClass}">
      <h1>${data.headerText}</h1>
      ${data.headerSubtext ? `<p>${data.headerSubtext}</p>` : ''}
    </div>
    
    ${bodyContent}
    
    ${includeFooter ? EMAIL_FOOTER : ''}
  </div>
</body>
</html>`;
}

// Email template types for the developer dashboard
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'orders' | 'auth' | 'notifications' | 'banking' | 'general';
  requiredFields: string[];
  defaultData: Record<string, any>;
  generator: (data: any) => { html: string; text: string; subject: string };
}
