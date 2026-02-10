"use client";

import { useEffect, useState } from "react";

interface ApiResponse {
  message: string;
  timestamp?: string;
  error?: string;
  details?: string;
}

export default function HealthPage() {
  const [apiStatus, setApiStatus] = useState<string>("Checking...");
  const [dbStatus, setDbStatus] = useState<string>("Checking...");
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [dbData, setDbData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/test")
      .then((res) => res.json())
      .then((data) => {
        setApiStatus("Connected");
        setApiData(data);
      })
      .catch(() => {
        setApiStatus("Disconnected");
      });

    fetch("http://localhost:3001/api/db-test")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setDbStatus("Error");
        } else {
          setDbStatus("Connected");
        }
        setDbData(data);
      })
      .catch(() => {
        setDbStatus("Disconnected");
      });
  }, []);

  function statusColor(status: string) {
    if (status === "Connected") return "text-green-600";
    if (status === "Checking...") return "text-yellow-600";
    return "text-red-500";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground text-center">System Status</h1>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium text-foreground">Backend API</span>
            <span className={`font-semibold ${statusColor(apiStatus)}`}>{apiStatus}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium text-foreground">Database</span>
            <span className={`font-semibold ${statusColor(dbStatus)}`}>{dbStatus}</span>
          </div>
        </div>

        {apiData && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2 text-foreground">API Response</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        )}

        {dbData && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2 text-foreground">Database Response</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(dbData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
