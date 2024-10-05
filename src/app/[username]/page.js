"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserDashboard({ params }) {
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      console.log('Token from localStorage:', token); // Add this line for debugging

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/rounds?username=${params.username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status); // Add this line for debugging

      if (response.ok) {
        const data = await response.json();
        setRounds(data.rounds);
        setCurrentRound(data.currentRound || []);
      } else if (response.status === 401) {
        const errorData = await response.json();
        console.error('Authorization error:', errorData); // Add this line for debugging
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rounds');
      }
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
      setError(error.message || 'Failed to load rounds. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard for {params.username}</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Round</CardTitle>
        </CardHeader>
        <CardContent>
          {currentRound.length > 0 ? (
            <ul className="list-disc list-inside">
              {currentRound.map((game, index) => (
                <li key={index}>{game.gameId} {game.isFastTrack ? '(Fast Track)' : ''}</li>
              ))}
            </ul>
          ) : (
            <p>No current round selected</p>
          )}
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rounds.map((round, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Round {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside">
                {round.games.map((game, gameIndex) => (
                  <li key={gameIndex}>{game.gameId} {game.isFastTrack ? '(Fast Track)' : ''}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}