#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that need DialogContent fixes
const filesToFix = [
  'src/components/DeleteProfileDialog.tsx',
  'src/components/ReportIssueDialog.tsx',
  'src/components/AddressEditDialog.tsx',
  'src/components/notifications/OrderNotificationSystem.tsx',
  'src/components/EmailChangeDialog.tsx',
  'src/components/SaleSuccessPopup.tsx',
  'src/components/university-info/EnhancedBursaryListing.tsx',
  'src/components/university-info/UniversitySpecificAPSDisplay.tsx',
  'src/components/university-info/BursaryListing.tsx',
  'src/components/CommitSystemExplainer.tsx',
  'src/components/SimpleAddressEditDialog.tsx',
  'src/components/admin/contact/ContactMessageCard.tsx',
  'src/components/admin/AdminUtilitiesTab.tsx',
  'src/components/orders/OrderCommitButton.tsx',
  'src/components/orders/OrderCommitButtonFallback.tsx'
];

// Patterns to fix
const fixes = [
  {
    pattern: /DialogContent className="max-w-md"/g,
    replacement: 'DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto"'
  },
  {
    pattern: /DialogContent className="max-w-2xl"/g,
    replacement: 'DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl mx-auto my-auto"'
  },
  {
    pattern: /DialogContent className="max-w-2xl max-h-\[90vh\] overflow-y-auto"/g,
    replacement: 'DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-y-auto"'
  },
  {
    pattern: /DialogContent className="sm:max-w-md"/g,
    replacement: 'DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto"'
  },
  {
    pattern: /DialogContent className="sm:max-w-2xl max-h-\[90vh\] overflow-y-auto"/g,
    replacement: 'DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-2xl max-h-[85vh] mx-auto my-auto overflow-y-auto"'
  },
  {
    pattern: /AlertDialogContent className="max-w-md"/g,
    replacement: 'AlertDialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto"'
  },
  {
    pattern: /AlertDialogContent>/g,
    replacement: 'AlertDialogContent className="w-[90vw] max-w-[90vw] sm:max-w-md mx-auto my-auto">'
  }
];

console.log('📱 Fixing remaining dialog components for mobile...\n');

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('\n🎉 Dialog mobile fixes complete!');
