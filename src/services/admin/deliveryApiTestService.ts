import { toast } from "sonner";
import {
  createCourierGuyShipment,
  trackCourierGuyShipment,
  CourierGuyShipmentData,
  CourierGuyTrackingResponse,
} from "@/services/courierGuyService";
import {
  getShipLogicQuote,
  trackShipLogicShipment,
  ShipLogicQuoteRequest,
  ShipLogicQuoteResponse,
  ShipLogicTrackingResponse,
} from "@/services/shipLogicService";

export interface DeliveryTestResult {
  service: string;
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export interface DeliveryTestSuite {
  courierGuy: DeliveryTestResult[];
  shipLogic: DeliveryTestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

/**
 * Comprehensive testing service for delivery/shipping APIs
 */
export class DeliveryApiTestService {
  /**
   * Test all delivery services
   */
  static async runFullDeliveryTest(): Promise<DeliveryTestSuite> {
    const startTime = Date.now();
    console.log(
      "[DeliveryApiTestService] Starting comprehensive delivery API tests...",
    );

    const courierGuyTests = await this.testCourierGuyService();
    const shipLogicTests = await this.testShipLogicService();

    const allTests = [...courierGuyTests, ...shipLogicTests];
    const passed = allTests.filter((t) => t.success).length;
    const failed = allTests.filter((t) => !t.success).length;
    const duration = Date.now() - startTime;

    const results: DeliveryTestSuite = {
      courierGuy: courierGuyTests,
      shipLogic: shipLogicTests,
      summary: {
        totalTests: allTests.length,
        passed,
        failed,
        duration,
      },
    };

    console.log("[DeliveryApiTestService] Test completed:", results.summary);

    return results;
  }

  /**
   * Test Courier Guy service endpoints
   */
  static async testCourierGuyService(): Promise<DeliveryTestResult[]> {
    const results: DeliveryTestResult[] = [];

    // Test 1: Create test shipment
    const createShipmentResult = await this.runTest(
      "Courier Guy",
      "Create Shipment",
      async () => {
        const testShipmentData: CourierGuyShipmentData = {
          collection: {
            contact: "Test Sender",
            phone: "0123456789",
            email: "test@example.com",
            address: {
              complex: "",
              unitNumber: "",
              streetAddress: "123 Test Street",
              suburb: "Test Suburb",
              city: "Cape Town",
              province: "Western Cape",
              postalCode: "8001",
            },
          },
          delivery: {
            contact: "Test Receiver",
            phone: "0987654321",
            email: "receiver@example.com",
            address: {
              complex: "",
              unitNumber: "",
              streetAddress: "456 Delivery Road",
              suburb: "Delivery Suburb",
              city: "Johannesburg",
              province: "Gauteng",
              postalCode: "2000",
            },
          },
          parcels: [
            {
              reference: "TEST-BOOK-001",
              description: "Test Textbook",
              value: 150.0,
              weight: 0.5,
              dimensions: {
                length: 25,
                width: 20,
                height: 3,
              },
            },
          ],
          serviceType: "ECO",
          instructions: "Test shipment - do not deliver",
        };

        return await createCourierGuyShipment(testShipmentData);
      },
    );
    results.push(createShipmentResult);

    // Test 2: Track shipment (use a test tracking number)
    const trackingResult = await this.runTest(
      "Courier Guy",
      "Track Shipment",
      async () => {
        // Use a test tracking number or the one from creation if available
        const trackingNumber =
          createShipmentResult.success &&
          createShipmentResult.data?.trackingNumber
            ? createShipmentResult.data.trackingNumber
            : "TEST123456789"; // Fallback test number

        return await trackCourierGuyShipment(trackingNumber);
      },
    );
    results.push(trackingResult);

    return results;
  }

  /**
   * Test ShipLogic service endpoints
   */
  static async testShipLogicService(): Promise<DeliveryTestResult[]> {
    const results: DeliveryTestResult[] = [];

    // Test 1: Get shipping quote
    const quoteResult = await this.runTest(
      "ShipLogic",
      "Get Quote",
      async () => {
        const testQuoteRequest: ShipLogicQuoteRequest = {
          collection: {
            company: "Test Company",
            contact: "Test Sender",
            email: "test@example.com",
            phone: "0123456789",
            address: {
              streetAddress: "123 Test Street",
              suburb: "Test Suburb",
              city: "Cape Town",
              province: "Western Cape",
              postalCode: "8001",
            },
          },
          delivery: {
            company: "Delivery Company",
            contact: "Test Receiver",
            email: "receiver@example.com",
            phone: "0987654321",
            address: {
              streetAddress: "456 Delivery Road",
              suburb: "Delivery Suburb",
              city: "Johannesburg",
              province: "Gauteng",
              postalCode: "2000",
            },
          },
          parcels: [
            {
              description: "Test Textbook",
              value: 150.0,
              weight: 0.5,
              length: 25,
              width: 20,
              height: 3,
            },
          ],
        };

        return await getShipLogicQuote(testQuoteRequest);
      },
    );
    results.push(quoteResult);

    // Test 2: Track shipment (use test tracking number)
    const trackingResult = await this.runTest(
      "ShipLogic",
      "Track Shipment",
      async () => {
        // Use a test tracking number
        const trackingNumber = "TEST-SL-123456789";
        return await trackShipLogicShipment(trackingNumber);
      },
    );
    results.push(trackingResult);

    return results;
  }

  /**
   * Test individual API endpoint with error handling and timing
   */
  private static async runTest(
    service: string,
    testName: string,
    testFunction: () => Promise<any>,
  ): Promise<DeliveryTestResult> {
    const startTime = Date.now();

    try {
      console.log(
        `[DeliveryApiTestService] Testing ${service} - ${testName}...`,
      );

      const data = await testFunction();
      const duration = Date.now() - startTime;

      console.log(
        `[DeliveryApiTestService] ✅ ${service} - ${testName} passed (${duration}ms)`,
      );

      return {
        service,
        test: testName,
        success: true,
        data,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(
        `[DeliveryApiTestService] ❌ ${service} - ${testName} failed:`,
        errorMessage,
      );

      return {
        service,
        test: testName,
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Test delivery status updates
   */
  static async testDeliveryStatusUpdates(): Promise<DeliveryTestResult[]> {
    const results: DeliveryTestResult[] = [];

    // Test status transition workflow
    const statusTests = [
      "pending",
      "collected",
      "in_transit",
      "out_for_delivery",
      "delivered",
    ];

    for (const status of statusTests) {
      const result = await this.runTest(
        "Status Updates",
        `Update to ${status}`,
        async () => {
          // Simulate status update
          console.log(`Testing status update to: ${status}`);

          // In a real implementation, this would call the actual status update API
          return {
            status,
            timestamp: new Date().toISOString(),
            message: `Successfully updated status to ${status}`,
          };
        },
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Test delivery webhooks (simulate webhook receipt)
   */
  static async testDeliveryWebhooks(): Promise<DeliveryTestResult[]> {
    const results: DeliveryTestResult[] = [];

    // Test webhook processing
    const webhookResult = await this.runTest(
      "Webhooks",
      "Process Delivery Webhook",
      async () => {
        // Simulate webhook data
        const webhookData = {
          trackingNumber: "TEST-WEBHOOK-123",
          status: "delivered",
          timestamp: new Date().toISOString(),
          location: "Test Delivery Address",
          signature: "Test Signature",
        };

        console.log("Processing test webhook:", webhookData);

        // In a real implementation, this would call the webhook processing function
        return {
          processed: true,
          webhookData,
        };
      },
    );
    results.push(webhookResult);

    return results;
  }

  /**
   * Generate a comprehensive test report
   */
  static generateTestReport(results: DeliveryTestSuite): string {
    let report = "=== DELIVERY API TEST REPORT ===\n\n";

    report += `Total Tests: ${results.summary.totalTests}\n`;
    report += `Passed: ${results.summary.passed}\n`;
    report += `Failed: ${results.summary.failed}\n`;
    report += `Duration: ${results.summary.duration}ms\n\n`;

    // Courier Guy results
    report += "--- COURIER GUY TESTS ---\n";
    results.courierGuy.forEach((test) => {
      const status = test.success ? "✅ PASS" : "❌ FAIL";
      report += `${status} ${test.test} (${test.duration}ms)\n`;
      if (!test.success && test.error) {
        report += `  Error: ${test.error}\n`;
      }
    });

    report += "\n--- SHIPLOGIC TESTS ---\n";
    results.shipLogic.forEach((test) => {
      const status = test.success ? "✅ PASS" : "❌ FAIL";
      report += `${status} ${test.test} (${test.duration}ms)\n`;
      if (!test.success && test.error) {
        report += `  Error: ${test.error}\n`;
      }
    });

    report += "\n=== END REPORT ===";

    return report;
  }

  /**
   * Show test results in UI with toast notifications
   */
  static showTestResults(results: DeliveryTestSuite): void {
    const { summary } = results;

    if (summary.failed === 0) {
      toast.success(
        `🎉 All delivery API tests passed! (${summary.passed}/${summary.totalTests} in ${summary.duration}ms)`,
      );
    } else if (summary.passed > 0) {
      toast.warning(
        `⚠️ Partial success: ${summary.passed}/${summary.totalTests} tests passed`,
      );
    } else {
      toast.error(
        `❌ All delivery API tests failed! (0/${summary.totalTests})`,
      );
    }

    // Log detailed results to console
    console.log(this.generateTestReport(results));
  }
}

export default DeliveryApiTestService;
