"use client";

import { useState, useEffect } from "react";
import { Login } from "@/components/Login";
import { Signup } from "@/components/Signup";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient-x">
      <div className="bg-white p-8 rounded-lg shadow-md">
        {isLoggedIn ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome, {localStorage.getItem('username')}!</h1>
            <Link href={`/${localStorage.getItem('username')}`}>
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <>
            {showLogin ? (
              <Login onSuccess={handleAuthSuccess} />
            ) : (
              <Signup onSuccess={() => setShowLogin(true)} />
            )}
            <Button
              variant="link"
              onClick={() => setShowLogin(!showLogin)}
              className="mt-4"
            >
              {showLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}