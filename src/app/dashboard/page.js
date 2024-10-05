"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpCircle, Trash2, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

const GameForm = ({ onSubmit, fastTrackEnabled }) => {
  const [gameId, setGameId] = useState("")
  const [fastTrack, setFastTrack] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted with:", gameId, fastTrack);
    if (gameId.trim()) {
      onSubmit(gameId, fastTrack)
      setGameId("")
      setFastTrack(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="Enter Game ID"
          aria-label="Game ID"
        />
        <Button type="submit">Add Game</Button>
        {fastTrackEnabled && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fast-track"
              checked={fastTrack}
              onCheckedChange={setFastTrack}
            />
            <label
              htmlFor="fast-track"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Fast Track
            </label>
          </div>
        )}
      </div>
    </form>
  )
}

const CurrentRound = ({ currentRound, onClear }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>Current Round</CardTitle>
      <Button
        size="sm"
        variant="destructive"
        onClick={onClear}
        disabled={currentRound.length === 0}
        aria-label="Clear Current Round"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear
      </Button>
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
)

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
)

export default function DashboardPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Dashboard />
    </ErrorBoundary>
  );
}

const Dashboard = () => {
  const [rounds, setRounds] = useState([])
  const [currentRound, setCurrentRound] = useState([])
  const [fastTrackEnabled, setFastTrackEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log("Dashboard component mounted");
    fetchRounds();
  }, [])

  const fetchRounds = async () => {
    console.log("Fetching rounds...");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rounds');
      console.log("Fetch response:", response);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched rounds data:", data);
        
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

  const addGameToRounds = useCallback(async (newGameId, isFastTrack) => {
    console.log("Adding game:", newGameId, "Fast Track:", isFastTrack);
    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: newGameId,
          isFastTrack: isFastTrack
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save game');
      }
      
      const updatedData = await response.json();
      console.log("Updated data:", updatedData);
      setRounds(updatedData.rounds);
      setCurrentRound(updatedData.currentRound);
    } catch (error) {
      console.error('Failed to save game:', error);
      alert(`Failed to add game: ${error.message}`);
    }
  }, []);

  const handleSubmit = useCallback((gameId, fastTrack) => {
    console.log("handleSubmit called with:", gameId, fastTrack);
    if (isSubmitting) return;
    setIsSubmitting(true);
    addGameToRounds(gameId, fastTrack);
    setTimeout(() => setIsSubmitting(false), 500);
  }, [addGameToRounds, isSubmitting]);

  const moveToCurrentRound = useCallback(async (id) => {
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
  }, []);

  const clearCurrentRound = useCallback(async () => {
    try {
      const response = await fetch('/api/rounds', {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Failed to clear current round');
      }
  
      const updatedData = await response.json();
      setCurrentRound(updatedData.currentRound);
      setRounds(updatedData.rounds);
    } catch (error) {
      console.error('Failed to clear current round:', error);
      alert('Failed to clear current round. Please try again.');
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Game Dashboard</h1>
        <Link href="/settings">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={fastTrackEnabled}
            onCheckedChange={setFastTrackEnabled}
          />
          <span>Enable Fast Track</span>
        </label>
      </div>

      <GameForm onSubmit={handleSubmit} fastTrackEnabled={fastTrackEnabled} />

      <div className="mb-8">
        <CurrentRound currentRound={currentRound} onClear={clearCurrentRound} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rounds.map((round, index) => (
          <RoundCard
            key={round.id}
            round={{...round, roundNumber: index + 1}}
            onMoveToCurrentRound={moveToCurrentRound}
          />
        ))}
      </div>
    </div>
  )
}