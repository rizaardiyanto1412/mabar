"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpCircle, Trash2, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

const GameForm = ({ onSubmit, fastTrackEnabled }) => {
  const [gameId, setGameId] = useState("")
  const [fastTrack, setFastTrack] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (gameId.trim()) {
      onSubmit(gameId, fastTrack)
      setGameId("")
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
          {currentRound.map((id, index) => (
            <li key={index}>{id}</li>
          ))}
        </ul>
      ) : (
        <p>No current round selected</p>
      )}
    </CardContent>
  </Card>
)

const RoundCard = ({ round, index, onMoveToCurrentRound }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>Round {index + 1}</CardTitle>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onMoveToCurrentRound(index)}
        aria-label={`Move Round ${index + 1} to Current Round`}
      >
        <ArrowUpCircle className="h-4 w-4" />
      </Button>
    </CardHeader>
    <CardContent>
      <ul className="list-disc list-inside">
        {round.map((id, gameIndex) => (
          <li key={gameIndex}>{id}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

export default function Dashboard() {
  const [rounds, setRounds] = useState([])
  const [currentRound, setCurrentRound] = useState([])
  const [fastTrackEnabled, setFastTrackEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem("fastTrackEnabled")
    setFastTrackEnabled(storedValue === "true")
  }, [])

  const addGameToRounds = useCallback((newGameId, isFastTrack) => {
    setRounds(prevRounds => {
      const newRounds = JSON.parse(JSON.stringify(prevRounds));

      const gameExists = newRounds.some(round => round.includes(newGameId));
      if (gameExists) {
        console.log(`Game ${newGameId} already exists. Skipping addition.`);
        return prevRounds;
      }

      if (newRounds.length === 0) {
        return [[newGameId]];
      }

      if (isFastTrack) {
        // Find the first round with less than 4 Fast Track games
        let targetRoundIndex = newRounds.findIndex(round => 
          round.filter(id => id.includes("(Fast Track)")).length < 4
        );

        // If all rounds are full of Fast Track games, create a new round
        if (targetRoundIndex === -1) {
          newRounds.push([]);
          targetRoundIndex = newRounds.length - 1;
        }

        const targetRound = newRounds[targetRoundIndex];
        const lastFastTrackIndex = targetRound.findLastIndex(id => id.includes("(Fast Track)"));

        if (lastFastTrackIndex === -1) {
          targetRound.unshift(newGameId);
        } else {
          targetRound.splice(lastFastTrackIndex + 1, 0, newGameId);
        }

        // If the round now has more than 4 games, move the last non-Fast Track game
        if (targetRound.length > 4) {
          const lastNonFastTrackIndex = targetRound.findLastIndex(id => !id.includes("(Fast Track)"));
          if (lastNonFastTrackIndex !== -1) {
            const movedGame = targetRound.splice(lastNonFastTrackIndex, 1)[0];
            if (newRounds[targetRoundIndex + 1]) {
              newRounds[targetRoundIndex + 1].unshift(movedGame);
            } else {
              newRounds.push([movedGame]);
            }
          }
        }
      } else {
        // For non-Fast Track games, add to the last round or create a new one
        const lastRound = newRounds[newRounds.length - 1];
        if (lastRound.length < 4) {
          lastRound.push(newGameId);
        } else {
          newRounds.push([newGameId]);
        }
      }
      return newRounds;
    });
  }, []);

  const handleSubmit = useCallback((gameId, fastTrack) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const newGameId = fastTrack ? `${gameId} (Fast Track)` : gameId;
    addGameToRounds(newGameId, fastTrack);
    setTimeout(() => setIsSubmitting(false), 500); // Prevent submissions for 500ms
  }, [addGameToRounds, isSubmitting])

  const moveToCurrentRound = useCallback((index) => {
    setCurrentRound(rounds[index])
    setRounds((prevRounds) => prevRounds.filter((_, i) => i !== index))
  }, [rounds])

  const clearCurrentRound = useCallback(() => {
    setCurrentRound([])
  }, [])

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Game Dashboard</h1>
        <Link href="/settings">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <GameForm onSubmit={handleSubmit} fastTrackEnabled={fastTrackEnabled} />

      <div className="mb-8">
        <CurrentRound currentRound={currentRound} onClear={clearCurrentRound} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rounds.map((round, index) => (
          <RoundCard
            key={index}
            round={round}
            index={index}
            onMoveToCurrentRound={moveToCurrentRound}
          />
        ))}
      </div>
    </div>
  )
}