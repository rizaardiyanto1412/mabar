"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default function ArchivePage() {
  const [archivedRounds, setArchivedRounds] = useState({})

  useEffect(() => {
    fetchArchivedRounds()
  }, [])

  const fetchArchivedRounds = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('/api/rounds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json()
        console.log('Fetched archived rounds:', data.archivedRounds); // Add this line
        setArchivedRounds(data.archivedRounds)
      } else {
        throw new Error('Failed to fetch archived rounds');
      }
    } catch (error) {
      console.error('Failed to fetch archived rounds:', error)
      alert(`Failed to fetch archived rounds: ${error.message}`);
    }
  }

  const deleteArchivedRound = async (timestamp) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log('Attempting to delete archived round with timestamp:', timestamp);

      const response = await fetch('/api/rounds/archive', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the deleted round from the state
        setArchivedRounds(prevRounds => {
          const newRounds = { ...prevRounds };
          delete newRounds[timestamp];
          return newRounds;
        });
        alert(`Archived round deleted successfully. ${data.deletedCount} games removed.`);
      } else {
        console.error('Failed to delete archived round:', data);
        if (data.error === 'No matching archived rounds found') {
          alert(`No matching archived rounds found for timestamp: ${timestamp}. The data may be out of sync. Refreshing the page.`);
          fetchArchivedRounds(); // Refresh the data
        } else {
          throw new Error(data.error || 'Failed to delete archived round');
        }
      }
    } catch (error) {
      console.error('Failed to delete archived round:', error);
      alert(`Failed to delete archived round: ${error.message}`);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Archive</h1>
      {Object.entries(archivedRounds).map(([timestamp, games], index) => (
        <Card key={timestamp} className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Archived Round {index + 1}</CardTitle>
              <p className="text-sm text-gray-500">Archived on: {timestamp === 'unknown' ? 'Unknown date' : new Date(timestamp).toLocaleString()}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteArchivedRound(timestamp)}
              aria-label="Delete Archived Round"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {games.map((game, gameIndex) => (
                <li key={gameIndex}>{game.gameId} {game.isFastTrack ? '(Fast Track)' : ''}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}