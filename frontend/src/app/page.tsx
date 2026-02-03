"use client";

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link'
import { redirect } from 'next/navigation';
import { useEffect, useState } from "react";

interface ApiResponse {
  message: string;
  timestamp?: string;
  error?: string;
  details?: string;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("Checking...");
  const [dbStatus, setDbStatus] = useState<string>("Checking...");
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [dbData, setDbData] = useState<ApiResponse | null>(null);

  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    redirect('/home');
  }

  useEffect(() => {
    // Check API connection
    fetch("http://localhost:3001/api/test")
      .then((res) => res.json())
      .then((data) => {
        setApiStatus("Connected ✓");
        setApiData(data);
      })
      .catch(() => {
        setApiStatus("Disconnected ✗");
      });

    // Check Database connection
    fetch("http://localhost:3001/api/db-test")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setDbStatus("Error ✗");
        } else {
          setDbStatus("Connected ✓");
        }
        setDbData(data);
      })
      .catch(() => {
        setDbStatus("Disconnected ✗");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-2xl w-full mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
            🎰 Slotto
          </h1>
          
          <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
                System Status
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Backend API:
                  </span>
                  <span className={`font-semibold ${
                    apiStatus.includes("Connected") 
                      ? "text-green-600 dark:text-green-400" 
                      : apiStatus.includes("Checking")
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {apiStatus}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Database:
                  </span>
                  <span className={`font-semibold ${
                    dbStatus.includes("Connected") 
                      ? "text-green-600 dark:text-green-400" 
                      : dbStatus.includes("Checking")
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {dbStatus}
                  </span>
                </div>
              </div>
            </div>

            {apiData && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  API Response:
                </h3>
                <pre className="text-sm text-gray-600 dark:text-gray-400">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </div>
            )}

            {dbData && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Database Response:
                </h3>
                <pre className="text-sm text-gray-600 dark:text-gray-400">
                  {JSON.stringify(dbData, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-center pt-4">
              <p className="text-gray-600 dark:text-gray-400">
                Full-stack app with React/TypeScript, Next.js, Node.js, and PostgreSQL
              </p>
            </div>
            <div className="flex flex-row text-center pt-4">
	      <div className="flex-1">
		<Link href="/signup">Sign Up</Link>
	      </div>
	      <div className="flex-1">
		<Link href="/login">Login</Link>
	      </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
