"use client";  // Add this line at the top of the file

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle } from "lucide-react";

// Component to display the current round
const CurrentRound = ({ currentRound }) => (
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
);

// Component to display a single round
const RoundCard = ({ round, onMoveToCurrentRound }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>Round {round.roundNumber}</CardTitle>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onMoveToCurrentRound(round.id)}
        aria-label={`Move Round ${round.roundNumber} to Current Round`}
      >
        <ArrowUpCircle className="h-4 w-4" />
      </Button>
    </CardHeader>
    <CardContent>
      <ul className="list-disc list-inside">
        {round.games.map((game, gameIndex) => (
          <li key={gameIndex}>{game.gameId} {game.isFastTrack ? '(Fast Track)' : ''}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default function Home() {
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rounds');
      if (response.ok) {
        const data = await response.json();
        
        // Filter out current games from rounds
        const nonCurrentRounds = data.rounds.map(round => ({
          ...round,
          games: round.games.filter(game => !game.isCurrent)
        })).filter(round => round.games.length > 0);

        setRounds(nonCurrentRounds);
        setCurrentRound(data.currentRound || []);
      } else {
        throw new Error('Failed to fetch rounds');
      }
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
      setError('Failed to load rounds. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const moveToCurrentRound = async (id) => {
    try {
      const response = await fetch(`/api/rounds/move-to-current`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to move round to current');
      }

      const updatedData = await response.json();
      setRounds(updatedData.rounds);
      setCurrentRound(updatedData.currentRound);
    } catch (error) {
      console.error('Failed to move round to current:', error);
      alert('Failed to move round to current. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Game Rounds</h1>
      
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!isLoading && !error && (
        <>
          <CurrentRound currentRound={currentRound} />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rounds.map((round, index) => (
              <RoundCard
                key={round.id}
                round={{...round, roundNumber: index + 1}}
                onMoveToCurrentRound={moveToCurrentRound}
              />
            ))}
          </div>
          
          <div className="mt-8">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
