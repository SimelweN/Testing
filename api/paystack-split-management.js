import { corsHeaders, createSupabaseClient, errorResponse, successResponse, handleCORS } from "./_lib/utils.js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCORS(req, res);
  }

  try {
    // Handle health check
    if (req.url?.includes("health") || req.query?.health === "true") {
      return res.status(200).json({
        success: true,
        service: "paystack-split-management",
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: {
          paystack_configured: !!PAYSTACK_SECRET_KEY,
          supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        },
      });
    }

    // Validate request method
    if (!["POST", "GET", "PUT", "DELETE"].includes(req.method)) {
      return res.status(405).json({
        success: false,
        error: "METHOD_NOT_ALLOWED",
        details: {
          provided_method: req.method,
          allowed_methods: ["POST", "GET", "PUT", "DELETE"],
          message: "Split management endpoint accepts POST, GET, PUT, DELETE requests",
        },
        fix_instructions: "Use POST to create, GET to retrieve, PUT to update, DELETE to remove splits",
      });
    }

    // Check environment configuration
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: "PAYSTACK_NOT_CONFIGURED",
        details: {
          missing_env_vars: ["PAYSTACK_SECRET_KEY"],
          message: "Paystack integration is not configured",
        },
        fix_instructions: "Configure PAYSTACK_SECRET_KEY environment variable",
      });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case "POST":
        return await handleCreateSplit(req, res);
      case "GET":
        return await handleGetSplits(req, res);
      case "PUT":
        return await handleUpdateSplit(req, res);
      case "DELETE":
        return await handleDeleteSplit(req, res);
      default:
        return res.status(405).json({
          success: false,
          error: "METHOD_NOT_SUPPORTED",
          message: `Method ${req.method} is not supported`,
        });
    }
  } catch (error) {
    console.error("Split management error:", error);
    return res.status(500).json({
      success: false,
      error: "UNEXPECTED_SPLIT_MANAGEMENT_ERROR",
      details: {
        error_message: error.message,
        error_stack: error.stack,
        error_type: error.constructor.name,
        timestamp: new Date().toISOString(),
      },
      fix_instructions: "This is an unexpected server error. Check server logs for details.",
    });
  }
}

async function handleCreateSplit(req, res) {
  try {
    const splitData = req.body;

    const response = await fetch("https://api.paystack.co/split", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(splitData),
    });

    const result = await response.json();

    return res.status(response.status).json({
      success: response.ok,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "CREATE_SPLIT_FAILED",
      details: { error_message: error.message },
    });
  }
}

async function handleGetSplits(req, res) {
  try {
    const splitCode = req.query.split_code;

    let apiUrl = "https://api.paystack.co/split";
    if (splitCode) {
      apiUrl += `/${splitCode}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    return res.status(response.status).json({
      success: response.ok,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "GET_SPLITS_FAILED",
      details: { error_message: error.message },
    });
  }
}

async function handleUpdateSplit(req, res) {
  try {
    const splitCode = req.query.split_code;

    if (!splitCode) {
      return res.status(400).json({
        success: false,
        error: "SPLIT_CODE_REQUIRED",
        details: {
          message: "split_code query parameter is required for updates",
        },
      });
    }

    const updateData = req.body;

    const response = await fetch(`https://api.paystack.co/split/${splitCode}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    return res.status(response.status).json({
      success: response.ok,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "UPDATE_SPLIT_FAILED",
      details: { error_message: error.message },
    });
  }
}

async function handleDeleteSplit(req, res) {
  try {
    const splitCode = req.query.split_code;

    if (!splitCode) {
      return res.status(400).json({
        success: false,
        error: "SPLIT_CODE_REQUIRED",
        details: {
          message: "split_code query parameter is required for deletion",
        },
      });
    }

    const response = await fetch(`https://api.paystack.co/split/${splitCode}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    return res.status(response.status).json({
      success: response.ok,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "DELETE_SPLIT_FAILED",
      details: { error_message: error.message },
    });
  }
}
