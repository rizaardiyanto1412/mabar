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
          {currentRound.map((game) => (
            <li key={game.id}>{game.gameId} {game.isFastTrack ? '(Fast Track)' : ''}</li>
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
        onClick={() => onMoveToCurrentRound(round.roundNumber)}
        aria-label={`Move Round ${round.roundNumber} to Current Round`}
      >
        <ArrowUpCircle className="h-4 w-4" />
      </Button>
    </CardHeader>
    <CardContent>
      {Array.isArray(round.games) && round.games.length > 0 ? (
        <ul className="list-disc list-inside">
          {round.games.map((game) => (
            <li key={game.id}>{game.gameId} {game.isFastTrack ? '(Fast Track)' : ''}</li>
          ))}
        </ul>
      ) : (
        <p>No games in this round</p>
      )}
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
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  useEffect(() => {
    console.log("Dashboard component mounted");
    fetchRounds();
  }, [])

  const fetchRounds = async () => {
    console.log("Fetching rounds...");
    setIsLoading(true);
    setError(null);
    try {
      let token;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token') || sessionStorage.getItem('token');
      }
      
      if (!token) {
        console.error('No token found in storage');
        setIsAuthenticated(false);
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Token found:', token.substring(0, 10) + '...'); // Log first 10 characters of token

      const response = await fetch('/api/rounds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rounds');
      }
      
      const data = await response.json();
      console.log("Fetched rounds data:", data);
      
      // Ensure rounds is an array and each round has a games array
      // Filter out archived games
      const processedRounds = Array.isArray(data.rounds) 
        ? data.rounds.map(round => ({
            ...round,
            games: Array.isArray(round) ? round.filter(game => !game.isArchived) : []
          })).filter(round => round.games.length > 0)
        : [];

      setRounds(processedRounds);
      setCurrentRound(Array.isArray(data.currentRound) ? data.currentRound.filter(game => !game.isArchived) : []);
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
      setError(error.message || 'Failed to load rounds. Please try again later.');
      if (error.message.includes('No authentication token found')) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addGameToRounds = useCallback(async (newGameId, isFastTrack) => {
    console.log("Adding game:", newGameId, "Fast Track:", isFastTrack);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  const moveToCurrentRound = useCallback(async (roundIndex) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Moving round to current:', roundIndex); // Add this log

      const response = await fetch(`/api/rounds/move-to-current`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: roundIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move round to current');
      }

      const updatedData = await response.json();
      console.log('Updated data after moving round:', updatedData); // Add this log
      setRounds(updatedData.rounds);
      setCurrentRound(updatedData.currentRound);
    } catch (error) {
      console.error('Failed to move round to current:', error);
      alert('Failed to move round to current. Please try again.');
    }
  }, []);

  const clearCurrentRound = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Sending DELETE request to clear current round');

      const response = await fetch('/api/rounds', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Received response:', response.status, response.statusText);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to archive current round: ${response.statusText}`);
      }

      console.log('Updating state with new data');
      setRounds(prevRounds => {
        // Remove the archived games from all rounds
        const updatedRounds = prevRounds.map(round => {
          if (Array.isArray(round.games)) {
            return {
              ...round,
              games: round.games.filter(game => !game.isArchived)
            };
          }
          return round; // If round.games is not an array, return the round as is
        }).filter(round => Array.isArray(round.games) && round.games.length > 0);
        console.log('Updated rounds:', updatedRounds);
        return updatedRounds;
      });
      setCurrentRound([]);
      console.log('State updated successfully');

      // Optionally, you can show a message to the user that the round has been archived
      alert('Current round has been archived successfully.');
    } catch (error) {
      console.error('Failed to archive current round:', error);
      alert(`Failed to archive current round: ${error.message}`);
    }
  }, [currentRound]);

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
        {Array.isArray(rounds) && rounds.map((round, index) => (
          <RoundCard
            key={round.id || index}
            round={{...round, roundNumber: index + 1, games: round.games || []}}
            onMoveToCurrentRound={moveToCurrentRound}
          />
        ))}
      </div>
    </div>
  )
}