import { analyzeSentiment } from "@/lib/ai-service";
import { scrapeApp } from "@/lib/services/scraper";
import { supabaseAdmin } from "@/lib/supabase";
import { PLAN_LIMITS } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (userError) {
      console.error("Database error fetching user:", userError);
      return NextResponse.json(
        {
          error: "User not found in database",
          details: "Please visit /api/sync-user to create your user record",
          clerkUserId: userId,
          databaseError: userError.message,
        },
        { status: 404 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
          details: "Please visit /api/sync-user to create your user record",
          clerkUserId: userId,
        },
        { status: 404 },
      );
    }

    const { data: apps, error } = await supabaseAdmin
      .from("apps")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_competitor", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ apps });
  } catch (error) {
    console.error("Error fetching apps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (userError) {
      console.error("Database error fetching user:", userError);
      return NextResponse.json(
        {
          error: "User not found in database",
          details: "Please visit /api/sync-user to create your user record",
          clerkUserId: userId,
          databaseError: userError.message,
        },
        { status: 404 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
          details: "Please visit /api/sync-user to create your user record",
          clerkUserId: userId,
        },
        { status: 404 },
      );
    }

    const { count: appCount } = await supabaseAdmin
      .from("apps")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_competitor", false);

    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
    if (limits.apps !== -1 && appCount && appCount >= limits.apps) {
      return NextResponse.json(
        { error: `Plan limit reached. Upgrade to add more apps.` },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { appUrl, maxPages = 10 } = body;

    if (!appUrl) {
      return NextResponse.json(
        { error: "App URL is required" },
        { status: 400 },
      );
    }

    const scrapedData = await scrapeApp(appUrl, maxPages);

    const { data: existingApp } = await supabaseAdmin
      .from("apps")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", scrapedData.platform)
      .eq("app_id", scrapedData.appId)
      .eq("country", scrapedData.country)
      .single();

    if (existingApp) {
      return NextResponse.json(
        { error: "App already tracked" },
        { status: 409 },
      );
    }

    const { data: app, error: appError } = await supabaseAdmin
      .from("apps")
      .insert({
        user_id: user.id,
        platform: scrapedData.platform,
        app_id: scrapedData.appId,
        country: scrapedData.country,
        name: scrapedData.metadata.name,
        developer: scrapedData.metadata.developer,
        icon_url: scrapedData.metadata.icon_url,
        category: scrapedData.metadata.category,
        current_rating: scrapedData.metadata.current_rating,
        rating_count: scrapedData.metadata.rating_count,
        current_version: scrapedData.metadata.current_version,
        description: scrapedData.metadata.description,
        app_url: appUrl,
        last_fetched_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) throw appError;

    const reviewsToInsert = await Promise.all(
      scrapedData.reviews
        .slice(0, limits.reviews === -1 ? undefined : limits.reviews)
        .map(async (review) => {
          let sentiment: {
            label: "positive" | "neutral" | "negative";
            score: number;
            magnitude: number;
          } = {
            label: "neutral",
            score: 0,
            magnitude: 0,
          };

          if (limits.ai_features && review.content) {
            sentiment = await analyzeSentiment(review.content);
          }

          return {
            app_id: app.id,
            platform: scrapedData.platform,
            review_id: review.review_id,
            title: review.title,
            content: review.content,
            rating: review.rating,
            author_name: review.author,
            app_version: review.version,
            date: review.date,
            helpful_count: review.helpful_count,
            sentiment_label: sentiment.label,
            sentiment_score: sentiment.score,
            sentiment_magnitude: sentiment.magnitude,
            ai_analyzed: limits.ai_features,
          };
        }),
    );

    if (reviewsToInsert.length > 0) {
      const { error: reviewsError } = await supabaseAdmin
        .from("reviews")
        .insert(reviewsToInsert);

      if (reviewsError) console.error("Error inserting reviews:", reviewsError);
    }

    return NextResponse.json({ app, reviewsCount: reviewsToInsert.length });
  } catch (error) {
    console.error("Error adding app:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
