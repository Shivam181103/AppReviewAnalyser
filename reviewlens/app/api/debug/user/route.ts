import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Not authenticated",
        userId: null 
      }, { status: 401 });
    }

    // Check if user exists in database
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    return NextResponse.json({
      clerkUserId: userId,
      databaseUser: user,
      databaseError: error,
      userExists: !!user,
      envVars: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint error",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
