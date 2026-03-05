"use client";

import { useState } from "react";

export default function SyncTestPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sync-user-simple", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">User Sync Test</h1>

        <button
          onClick={handleSync}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Syncing..." : "Sync User to Database"}
        </button>

        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
