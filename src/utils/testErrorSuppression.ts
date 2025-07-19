/**
 * Test utility to verify error suppression is working correctly
 */

// Function to simulate the exact errors from the stack trace
export const testErrorSuppression = () => {
  if (!import.meta.env.DEV) {
    console.log("Error suppression tests only run in development mode");
    return;
  }

  console.log("🧪 Testing error suppression...");

  // Test 1: Simulate FullStory error
  setTimeout(() => {
    try {
      throw new Error(
        "TypeError: Failed to fetch at e (https://edge.fullstory.com/s/fs.js:4:60118)",
      );
    } catch (error) {
      console.error(error.message);
    }
  }, 100);

  // Test 2: Simulate Vite client error
  setTimeout(() => {
    try {
      const error = new Error("Failed to fetch");
      error.stack = `TypeError: Failed to fetch
    at ping (https://213f0d6feb0c4f74bf8db7ef237f0dbe-315d37effbbd45138374f8eea.fly.dev/@vite/client:732:13)
    at waitForSuccessfulPing (https://213f0d6feb0c4f74bf8db7ef237f0dbe-315d37effbbd45138374f8eea.fly.dev/@vite/client:745:13)
    at WebSocket.<anonymous> (https://213f0d6feb0c4f74bf8db7ef237f0dbe-315d37effbbd45138374f8eea.fly.dev/@vite/client:557:13)`;
      throw error;
    } catch (error) {
      console.error(error.message, error);
    }
  }, 200);

  // Test 3: Simulate eval error
  setTimeout(() => {
    try {
      throw new Error(
        "Failed to fetch at window.fetch (eval at messageHandler)",
      );
    } catch (error) {
      console.error(error.message);
    }
  }, 300);

  // Test 4: Create a promise rejection
  setTimeout(() => {
    Promise.reject(new Error("Failed to fetch from edge.fullstory.com"));
  }, 400);

  // Test 5: Simulate network fetch error to FullStory
  setTimeout(async () => {
    try {
      await fetch("https://edge.fullstory.com/test-endpoint");
    } catch (error) {
      // This should be suppressed
      console.log("FullStory fetch error (should be suppressed)");
    }
  }, 500);

  setTimeout(() => {
    console.log(
      "✅ Error suppression test completed. Check console for 'Suppressed' messages.",
    );
  }, 1000);
};

// Auto-run test in development when this file is imported
if (import.meta.env.DEV) {
  // Run test after a delay to ensure suppression is set up
  setTimeout(testErrorSuppression, 2000);
}

export default testErrorSuppression;
