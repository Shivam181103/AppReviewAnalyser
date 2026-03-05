"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface App {
  id: string;
  name: string;
  platform: string;
  developer: string;
  icon_url: string;
  current_rating: number;
  rating_count: number;
  current_version: string;
  description: string;
  created_at: string;
  last_fetched_at: string;
}

export default function AppDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppDetails();
  }, [params.id]);

  const fetchAppDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/apps/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch app details");
      }

      const data = await response.json();
      setApp(data.app);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load app details",
        variant: "destructive",
      });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading app details...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return null;
  }

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {app.icon_url && (
                <img
                  src={app.icon_url}
                  alt={app.name}
                  className="w-20 h-20 rounded-lg"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl">{app.name}</CardTitle>
                <p className="text-muted-foreground mt-1">{app.developer}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                    {app.platform.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    v{app.current_version}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold">
                    {app.current_rating?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {app.rating_count?.toLocaleString() || "0"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">Active</span>
                </div>
                <p className="text-sm text-muted-foreground">Status</p>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span className="text-2xl font-bold">
                    {new Date(app.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Added</p>
              </div>
            </div>

            {app.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {app.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Review analytics coming soon...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                AI-powered insights coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
