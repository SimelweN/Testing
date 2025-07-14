import { handleCORS } from "./_lib/utils.js";

export default async function handler(req, res) {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        email: process.env.BREVO_SMTP_KEY ? "configured" : "not_configured",
        supabase: process.env.SUPABASE_URL ? "configured" : "not_configured",
        courier_guy: process.env.COURIER_GUY_API_KEY
          ? "configured"
          : "not_configured",
        fastway: process.env.FASTWAY_API_KEY ? "configured" : "not_configured",
      },
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };

    return res.status(200).json(health);
  } catch (error) {
    return res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
