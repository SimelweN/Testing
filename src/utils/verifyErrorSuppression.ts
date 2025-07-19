/**
 * Simple verification that error suppression is working
 */

export const verifyErrorSuppression = () => {
  if (!import.meta.env.DEV) return;

  console.log("🧪 Verifying error suppression...");

  // Test the exact errors from the user's report
  setTimeout(() => {
    console.error(
      "TypeError: Failed to fetch at e (https://edge.fullstory.com/s/fs.js:4:60118)",
    );
  }, 100);

  setTimeout(() => {
    console.error(
      "Failed to fetch TypeError: Failed to fetch at ping (https://213f0d6feb0c4f74bf8db7ef237f0dbe-315d37effbbd45138374f8eea.fly.dev/@vite/client:732:13)",
    );
  }, 200);

  setTimeout(() => {
    console.error("Failed to fetch at window.fetch (eval at messageHandler)");
  }, 300);

  setTimeout(() => {
    console.log(
      "✅ Error suppression test complete. Errors should be suppressed and appear in debug log only.",
    );
  }, 500);
};

// Auto-run in development
if (import.meta.env.DEV) {
  setTimeout(verifyErrorSuppression, 1000);
}

export default verifyErrorSuppression;
