import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    // Get user data from Clerk
    const clerkUser = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    })
      .then((res) => res.json())
      .catch(() => null);

    if (!clerkUser) {
      return NextResponse.json(
        {
          error: "Failed to fetch user data from Clerk",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (existingUser) {
      return NextResponse.json({
        message: "User already exists",
        user: existingUser,
      });
    }

    // Create user in database using service role (bypasses RLS)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: newUser, error } = await supabaseAdmin.rpc(
      "admin_create_user",
      {
        p_clerk_id: userId,
        p_email: clerkUser.email_addresses?.[0]?.email_address || "",
        p_name:
          `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() ||
          "User",
        p_avatar_url: clerkUser.image_url || "",
        p_plan: "pro",
        p_trial_ends_at: trialEndsAt.toISOString(),
        p_subscription_status: "trialing",
      },
    );

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to create user",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Sync endpoint error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
