"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Star, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);

  const handleAddApp = async () => {
    if (!appUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an App Store URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appUrl, maxPages: 10 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add app");
      }

      toast({
        title: "Success",
        description: `App added! Fetched ${data.reviewsCount} reviews`,
      });
      setAppUrl("");
      setIsDialogOpen(false);
      fetchApps();
    } catch (error: any) {
      console.error("Error adding app:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add app",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApps = async () => {
    try {
      const response = await fetch("/api/apps");
      const data = await response.json();
      setApps(data.apps || []);
    } catch (error) {
      console.error("Failed to fetch apps:", error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze your app reviews
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add App
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New App</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  App Store URL
                </label>
                <Input
                  placeholder="https://apps.apple.com/us/app/..."
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the URL of any iOS app from the App Store
                </p>
              </div>
              <Button
                onClick={handleAddApp}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Adding..." : "Add App"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {apps.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No apps tracked yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first app to start analyzing reviews and gaining insights
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Your First App
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app: any) => (
            <Card
              key={app.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {app.icon_url && (
                  <img
                    src={app.icon_url}
                    alt={app.name}
                    className="w-16 h-16 rounded-xl"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{app.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {app.developer}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">
                      {app.current_rating?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-semibold">
                      {app.rating_count?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold text-green-500">+12%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push(`/apps/${app.id}`)}
              >
                View Details
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
