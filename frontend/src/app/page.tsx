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

  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    redirect('/home');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow">
        <Link href="/" className="text-xl font-bold text-gray-800 dark:text-white">Slotto</Link>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">Login</Link>
          <Link href="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Sign Up</Link>
        </div>
      </nav>
      <main className="flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
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
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
