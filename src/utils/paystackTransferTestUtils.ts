import { supabase } from "@/integrations/supabase/client";

export interface TransferTestData {
  real_subaccounts: any[];
  real_orders: any[];
  real_transactions: any[];
  test_recipients: any[];
  suggested_transfers: any[];
}

export interface TestTransferScenario {
  name: string;
  description: string;
  amount: number;
  recipient_code: string;
  reason: string;
  expected_result: 'success' | 'failure';
}

export class PaystackTransferTestHelper {
  
  /**
   * Load all real data needed for comprehensive testing
   */
  static async loadTestData(): Promise<TransferTestData> {
    try {
      const [subaccountsResult, ordersResult, transactionsResult] = await Promise.all([
        // Get active subaccounts with banking details
        supabase
          .from('banking_subaccounts')
          .select(`
            *,
            profiles!user_id(name, email)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
          
        // Get recent orders with payments
        supabase
          .from('orders')
          .select('*')
          .not('payment_reference', 'is', null)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10),
          
        // Get successful payment transactions
        supabase
          .from('payment_transactions')
          .select('*')
          .eq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const testData: TransferTestData = {
        real_subaccounts: subaccountsResult.data || [],
        real_orders: ordersResult.data || [],
        real_transactions: transactionsResult.data || [],
        test_recipients: [],
        suggested_transfers: []
      };

      // Generate test recipients from real subaccounts
      testData.test_recipients = testData.real_subaccounts.map(subaccount => ({
        name: subaccount.business_name || `Business ${subaccount.id.slice(-8)}`,
        description: `Recipient for ${subaccount.business_name}`,
        account_number: subaccount.account_number,
        bank_code: subaccount.bank_code,
        bank_name: subaccount.bank_name,
        subaccount_code: subaccount.subaccount_code,
        currency: 'ZAR'
      }));

      // Generate suggested transfer scenarios
      testData.suggested_transfers = testData.real_subaccounts.slice(0, 5).map((subaccount, index) => ({
        name: `Test Transfer ${index + 1}`,
        description: `Transfer to ${subaccount.business_name}`,
        amount: (index + 1) * 10, // R10, R20, R30, etc.
        recipient_code: subaccount.subaccount_code,
        reason: `Test payout #${index + 1} to seller`,
        expected_result: 'success' as const
      }));

      return testData;
    } catch (error) {
      console.error('Error loading test data:', error);
      throw error;
    }
  }

  /**
   * Create test recipients for transfer testing
   */
  static async createTestRecipients(testData: TransferTestData): Promise<any[]> {
    const results = [];
    
    for (const recipient of testData.test_recipients.slice(0, 3)) { // Test with first 3
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/paystack-transfer-management?action=create-recipient`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify(recipient)
        });
        
        const result = await response.json();
        results.push({
          recipient: recipient.name,
          success: result.success,
          data: result.data,
          error: result.error
        });
      } catch (error) {
        results.push({
          recipient: recipient.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Test transfer scenarios
   */
  static async runTransferScenarios(scenarios: TestTransferScenario[]): Promise<any[]> {
    const results = [];
    
    for (const scenario of scenarios) {
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/paystack-transfer-management?action=initiate-transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            amount: scenario.amount,
            reference: `test_transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recipient: scenario.recipient_code,
            reason: scenario.reason
          })
        });
        
        const result = await response.json();
        results.push({
          scenario: scenario.name,
          success: result.success,
          data: result.data,
          error: result.error,
          expected: scenario.expected_result,
          passed: result.success === (scenario.expected_result === 'success')
        });
      } catch (error) {
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message,
          expected: scenario.expected_result,
          passed: false
        });
      }
    }
    
    return results;
  }

  /**
   * Test refund scenarios with real transaction data
   */
  static async runRefundScenarios(testData: TransferTestData): Promise<any[]> {
    const results = [];
    
    // Test with real transaction references
    for (const transaction of testData.real_transactions.slice(0, 2)) {
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/paystack-refund-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'initiate_refund',
            transaction_reference: transaction.reference,
            refund_amount: Math.min(1000, transaction.amount), // Refund R10 or transaction amount if less
            refund_reason: 'Test refund scenario',
            admin_initiated: true
          })
        });
        
        const result = await response.json();
        results.push({
          scenario: `Refund ${transaction.reference}`,
          success: result.success,
          data: result.data,
          error: result.error,
          transaction_amount: transaction.amount,
          refund_amount: Math.min(1000, transaction.amount)
        });
      } catch (error) {
        results.push({
          scenario: `Refund ${transaction.reference}`,
          success: false,
          error: error.message,
          transaction_amount: transaction.amount
        });
      }
    }

    // Test with real order IDs
    for (const order of testData.real_orders.slice(0, 2)) {
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/paystack-refund-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'initiate_refund',
            order_id: order.id,
            refund_amount: Math.min(1000, order.total_amount * 100), // R10 in kobo
            refund_reason: 'Test order refund scenario',
            admin_initiated: true
          })
        });
        
        const result = await response.json();
        results.push({
          scenario: `Order Refund ${order.id}`,
          success: result.success,
          data: result.data,
          error: result.error,
          order_amount: order.total_amount
        });
      } catch (error) {
        results.push({
          scenario: `Order Refund ${order.id}`,
          success: false,
          error: error.message,
          order_amount: order.total_amount
        });
      }
    }
    
    return results;
  }

  /**
   * Run comprehensive test suite
   */
  static async runComprehensiveTests(): Promise<{
    testData: TransferTestData;
    recipientTests: any[];
    transferTests: any[];
    refundTests: any[];
    summary: {
      total_tests: number;
      passed: number;
      failed: number;
      success_rate: number;
    };
  }> {
    console.log('🧪 Starting comprehensive Paystack transfer tests...');
    
    try {
      // Load test data
      console.log('📊 Loading test data...');
      const testData = await this.loadTestData();
      console.log(`Found ${testData.real_subaccounts.length} subaccounts, ${testData.real_orders.length} orders, ${testData.real_transactions.length} transactions`);
      
      // Test recipient creation
      console.log('👥 Testing recipient creation...');
      const recipientTests = await this.createTestRecipients(testData);
      
      // Test transfers
      console.log('💸 Testing transfers...');
      const transferTests = await this.runTransferScenarios(testData.suggested_transfers);
      
      // Test refunds
      console.log('🔄 Testing refunds...');
      const refundTests = await this.runRefundScenarios(testData);
      
      // Calculate summary
      const allTests = [...recipientTests, ...transferTests, ...refundTests];
      const passed = allTests.filter(test => test.success || test.passed).length;
      const failed = allTests.length - passed;
      
      const summary = {
        total_tests: allTests.length,
        passed,
        failed,
        success_rate: (passed / allTests.length) * 100
      };
      
      console.log(`✅ Tests completed: ${passed}/${allTests.length} passed (${summary.success_rate.toFixed(1)}%)`);
      
      return {
        testData,
        recipientTests,
        transferTests,
        refundTests,
        summary
      };
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }
}
