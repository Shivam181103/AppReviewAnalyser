import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Use service role key to bypass RLS
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Not authenticated" 
      }, { status: 401 });
    }

    // Get user data from Clerk
    const clerkUser = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }).then(res => res.json()).catch(() => null);

    if (!clerkUser) {
      return NextResponse.json({ 
        error: "Failed to fetch user data from Clerk" 
      }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseService
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        message: "User already exists",
        user: existingUser
      });
    }

    // Create user in database (bypasses RLS with service role)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: newUser, error } = await supabaseService
      .from("users")
      .insert({
        clerk_id: userId,
        email: clerkUser.email_addresses?.[0]?.email_address || "",
        name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || "User",
        avatar_url: clerkUser.image_url || "",
        plan: 'pro',
        trial_ends_at: trialEndsAt.toISOString(),
        subscription_status: 'trialing',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: "Failed to create user",
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "User created successfully",
      user: newUser
    });

  } catch (error) {
    return NextResponse.json({
      error: "Sync endpoint error",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
