import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/services/admin/adminAuthService";
import {
  logError,
  getErrorMessage,
  retryWithExponentialBackoff,
  withTimeout,
  isNetworkError,
} from "@/utils/errorUtils";

export interface Profile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: string;
  profile_picture_url?: string;
  bio?: string;
}

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", {
      message: error.message,
      code: error.name || error.code,
      details: error.details || error.hint,
    });

    // Create proper Error object with user-friendly message
    let errorMessage = error.message || 'Login failed';

    // Provide specific messages for common errors
    if (errorMessage.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password. Please check your credentials and try again.';
    } else if (errorMessage.includes('Email not confirmed')) {
      errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification link.';
    } else if (errorMessage.includes('Too many requests')) {
      errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
    }

    throw new Error(errorMessage);
  }

  console.log("Login successful for:", email);
  return data;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  // First try the standard Supabase signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${window.location.origin}/verify`,
    },
  });

  if (error) {
    console.error("Registration error:", {
      message: error.message,
      code: error.name || error.code,
      details: error.details || error.hint,
    });
    throw error;
  }

  console.log("Registration successful for:", email);

  // Check if email verification is working
  if (data.user && !data.session) {
    console.log("✅ Registration successful - email verification required");
    console.log(
      "ℹ️ Note: User should check their email inbox (including spam folder) for verification link",
    );
  } else if (data.user && data.session) {
    console.log(
      "✅ Registration successful - email verification disabled, user logged in",
    );

    // Since email verification is disabled, send a welcome email
    try {
      // Import dynamically to avoid circular dependencies
      const { emailService } = await import("./emailService");

      await emailService.sendEmail({
        to: email,
        from: "noreply@rebookedsolutions.co.za",
        subject: "Welcome to ReBooked Solutions! 📚",
        html: generateWelcomeEmailHTML(name, email),
        text: generateWelcomeEmailText(name, email),
      });

      console.log("✅ Welcome email sent to new user");
    } catch (emailError) {
      console.warn("⚠️ Welcome email failed (non-critical):", emailError);
      // Don't fail registration for email issues
    }
  }

  return data;
};

// Helper functions for welcome email
const generateWelcomeEmailHTML = (name: string, email: string): string => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Welcome to ReBooked Solutions</title>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f3fef7; padding: 20px; color: #1f4e3d; }
      .container { max-width: 500px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
      .welcome-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0; }
      .btn { display: inline-block; padding: 12px 20px; background-color: #3ab26f; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🎉 Welcome to ReBooked Solutions!</h1>

      <div class="welcome-box">
        <strong>✅ Your account has been created successfully!</strong>
      </div>

      <p>Hi ${name}!</p>

      <p>Welcome to South Africa's premier textbook marketplace! Your account is now active and you can:</p>

      <ul>
        <li>📚 Browse thousands of affordable textbooks</li>
        <li>💰 Sell your textbooks to other students</li>
        <li>🚚 Enjoy convenient doorstep delivery</li>
        <li>🎓 Connect with students at your university</li>
      </ul>

      <a href="${window.location.origin}/books" class="btn">Start Browsing Books</a>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="font-size: 12px; color: #6b7280;">
        <strong>Thank you for joining ReBooked Solutions!</strong><br>
        Account: ${email}<br>
        Support: support@rebookedsolutions.co.za<br>
        <em>"Pre-Loved Pages, New Adventures"</em>
      </p>
    </div>
  </body>
  </html>
`;

const generateWelcomeEmailText = (name: string, email: string): string => `
  Welcome to ReBooked Solutions!

  Hi ${name}!

  Your account has been created successfully! Welcome to South Africa's premier textbook marketplace.

  You can now:
  - Browse thousands of affordable textbooks
  - Sell your textbooks to other students
  - Enjoy convenient doorstep delivery
  - Connect with students at your university

  Visit ${window.location.origin}/books to start browsing!

  Account: ${email}
  Support: support@rebookedsolutions.co.za

  "Pre-Loved Pages, New Adventures"
`;

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", {
      message: error.message,
      code: error.name || error.code,
      details: error.details || error.hint,
    });
    throw error;
  }
  console.log("Logout successful");
};

export const fetchUserProfileQuick = async (
  user: User,
): Promise<Profile | null> => {
  try {
    console.log("🔄 Quick profile fetch for user:", user.id);

    // Simplified approach with just one try and longer timeout
    const { data: profile, error: profileError } = (await withTimeout(
      supabase
        .from("profiles")
        .select("id, name, email, status, profile_picture_url, bio, is_admin")
        .eq("id", user.id)
        .single(),
      12000, // Increased to 12 seconds
      "Quick profile fetch timed out after 12 seconds",
    )) as any;

    if (profileError) {
      // Profile not found is normal for new users
      if (profileError.code === "PGRST116") {
        console.log(
          "ℹ️ Profile not found in quick fetch, will create in background",
        );
        return null; // Return null so fallback is used
      }

      // For other errors, log details but don't spam
      console.warn("⚠️ Quick profile fetch error:", {
        message: profileError.message || "Unknown error",
        code: profileError.code || "No code",
        hint: profileError.hint || "No hint",
      });
      return null; // Use fallback on any error
    }

    if (!profile) {
      console.log("ℹ️ No profile data returned, using fallback");
      return null; // Use fallback profile
    }

    // Quick admin check without background updates
    const adminEmails = ["AdminSimnLi@gmail.com", "adminsimnli@gmail.com"];
    const userEmail = profile.email || user.email || "";
    const isAdmin =
      profile.is_admin === true ||
      adminEmails.includes(userEmail.toLowerCase());

    const profileData = {
      id: profile.id,
      name:
        profile.name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User",
      email: profile.email || user.email || "",
      isAdmin,
      status: profile.status || "active",
      profile_picture_url: profile.profile_picture_url,
      bio: profile.bio,
    };

    console.log("✅ Quick profile fetch successful");
    return profileData;
  } catch (error) {
    // Enhanced error logging to debug the timeout issue
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
      isTimeout: (error as any)?.isTimeout || false,
      stack: error instanceof Error ? error.stack?.split("\n")[0] : undefined,
    };

    console.warn("⚠️ Quick profile fetch failed:", errorDetails);

    // Don't log as error since this is expected to fail sometimes
    // Just use fallback profile
    return null;
  }
};

export const fetchUserProfile = async (user: User): Promise<Profile | null> => {
  try {
    console.log("🔄 Fetching full profile for user:", user.id);

    // Enhanced retry logic with better error handling
    const result = await retryWithExponentialBackoff(
      async () => {
        return await withTimeout(
          supabase
            .from("profiles")
            .select(
              "id, name, email, status, profile_picture_url, bio, is_admin",
            )
            .eq("id", user.id)
            .single(),
          10000, // 10 second timeout for full fetch
          "Full profile fetch timed out",
        );
      },
      {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 5000,
        retryCondition: (error) => isNetworkError(error),
      },
    );

    const { data: profile, error: profileError } = result;

    if (profileError) {
      logError("Error fetching profile", profileError);

      if (profileError.code === "PGRST116") {
        console.log("Profile not found, creating new profile...");
        return await createUserProfile(user);
      }

      throw new Error(
        getErrorMessage(profileError, "Failed to fetch user profile"),
      );
    }

    if (!profile) {
      console.log("No profile found, creating new profile...");
      return await createUserProfile(user);
    }

    // Check admin status - first check the profile flag, then fallback to email check
    let isAdmin = false;

    if (profile.is_admin === true) {
      isAdmin = true;
      console.log("✅ Admin status from profile flag:", isAdmin);
    } else {
      // Quick email-based admin check without additional database calls
      const adminEmails = ["AdminSimnLi@gmail.com", "adminsimnli@gmail.com"];
      const userEmail = profile.email || user.email || "";
      isAdmin = adminEmails.includes(userEmail.toLowerCase());

      if (isAdmin) {
        console.log("✅ Admin status from email check:", isAdmin);
        // Update admin flag in background (non-blocking)
        supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", user.id)
          .then(() => console.log("✅ Admin flag updated in background"))
          .catch(() =>
            console.warn("⚠️ Failed to update admin flag in background"),
          );
      }
    }

    console.log(
      "Profile loaded successfully:",
      profile.name,
      "isAdmin:",
      isAdmin,
    );

    return {
      id: profile.id,
      name:
        profile.name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User",
      email: profile.email || user.email || "",
      isAdmin,
      status: profile.status || "active",
      profile_picture_url: profile.profile_picture_url,
      bio: profile.bio,
    };
  } catch (error) {
    logError("Error in fetchUserProfile", error);
    throw new Error(getErrorMessage(error, "Failed to load user profile"));
  }
};

export const createUserProfile = async (user: User): Promise<Profile> => {
  try {
    console.log("Creating profile for user:", user.id);

    // Check if user should be admin based on email
    const adminEmails = ["AdminSimnLi@gmail.com", "adminsimnli@gmail.com"];
    const userEmail = user.email || "";
    const isAdmin = adminEmails.includes(userEmail.toLowerCase());

    const profileData = {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      status: "active",
      is_admin: isAdmin, // Set admin flag during creation
    };

    // Use retry logic for profile creation as well
    const result = await retryWithExponentialBackoff(async () => {
      return await supabase
        .from("profiles")
        .insert([profileData])
        .select("id, name, email, status, profile_picture_url, bio, is_admin")
        .single();
    });

    const { data: newProfile, error: createError } = result;

    if (createError) {
      logError("Error creating profile", createError);
      throw new Error(
        getErrorMessage(createError, "Failed to create user profile"),
      );
    }

    console.log(
      "Profile created successfully:",
      newProfile.name,
      "Admin:",
      isAdmin,
    );

    // Create welcome notification for new user
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Welcome to ReBooked Solutions! 🎉",
        message: `Hi ${newProfile.name}! Welcome to South Africa's premier textbook marketplace. Start browsing textbooks, set up your profile, and join our community of students!`,
        type: "welcome",
        read: false,
      });
      console.log("✅ Welcome notification created for new user");
    } catch (notifError) {
      console.warn("Failed to create welcome notification:", notifError);
      // Don't fail user creation if notification fails
    }

    return {
      id: newProfile.id,
      name: newProfile.name,
      email: newProfile.email,
      isAdmin: newProfile.is_admin || false, // Use the admin status from database
      status: newProfile.status,
      profile_picture_url: newProfile.profile_picture_url,
      bio: newProfile.bio,
    };
  } catch (error) {
    logError("Error in createUserProfile", error);
    throw new Error(getErrorMessage(error, "Failed to create user profile"));
  }
};
