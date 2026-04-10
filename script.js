const fs = require('fs');
let content = fs.readFileSync('src/pages/Documents.tsx', 'utf-8');

// Remove Cash Request from manualForms
content = content.replace(/{ id: 'payment_voucher', title: 'Payment Voucher', roles: \['accountant'\] },\s*/g, '');
content = content.replace(/{ id: 'cash_request', title: 'Cash Request', roles: \['manager', 'assistant_hall_manager', 'cashier_1', 'accountant', 'store_keeper'\] },\s*/g, '');

// Remove Tabs Triggers
content = content.replace(/<TabsTrigger value="accountant_intake"[\S\s]*?<\/TabsTrigger>\s*/g, '');
content = content.replace(/<TabsTrigger value="voucher_capture"[\S\s]*?<\/TabsTrigger>\s*/g, '');
content = content.replace(/<TabsTrigger value="manager_halls"[\S\s]*?<\/TabsTrigger>\s*/g, '');

// Remove Accountant Cash Request / Payment Voucher Sections
content = content.replace(/<TabsContent value="accountant_intake"[\S\s]*?<\/TabsContent>\s*/g, '');
content = content.replace(/<TabsContent value="voucher_capture"[\S\s]*?<\/TabsContent>\s*/g, '');

// Remove Manager Cash Request Section
content = content.replace(/<TabsContent value="manager_halls"[\S\s]*?<\/TabsContent>\s*/g, '');

// Remove manual payment voucher and cash request components rendering
content = content.replace(/<TabsContent value="payment_voucher"[\S\s]*?<\/TabsContent>\s*/g, '');
content = content.replace(/<TabsContent value="cash_request"[\S\s]*?<\/TabsContent>\s*/g, '');

fs.writeFileSync('src/pages/Documents.tsx', content);
console.log('Done replacement');
