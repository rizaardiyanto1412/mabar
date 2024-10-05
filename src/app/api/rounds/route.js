import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamesTable } from '@/db/schema';
import { sql } from 'drizzle-orm';

const GAMES_PER_ROUND = 4;

export async function GET() {
  try {
    // Fetch all games, ordered by their order field
    const allGames = await db.select().from(gamesTable).orderBy(gamesTable.order);

    // Group games into rounds of 4
    const rounds = [];
    for (let i = 0; i < allGames.length; i += GAMES_PER_ROUND) {
      rounds.push({
        id: Math.floor(i / GAMES_PER_ROUND) + 1,
        roundNumber: Math.floor(i / GAMES_PER_ROUND) + 1,
        games: allGames.slice(i, i + GAMES_PER_ROUND)
      });
    }

    // Get current round (games where isCurrent is 1)
    const currentRound = allGames.filter(game => game.isCurrent === 1);

    return NextResponse.json({ rounds, currentRound });
  } catch (error) {
    console.error('Failed to fetch rounds:', error);
    return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 });
  }
}

export async function POST(request) {
  const { gameId, isFastTrack } = await request.json();

  try {
    // Get all games ordered by their current order
    const allGames = await db.select().from(gamesTable).orderBy(gamesTable.order);

    let newOrder;

    if (isFastTrack) {
      // For fast track games, find the last fast track game
      const lastFastTrackGame = allGames.filter(game => game.isFastTrack === 1).pop();
      
      if (lastFastTrackGame) {
        // Insert after the last fast track game
        newOrder = lastFastTrackGame.order + 1;
      } else {
        // If no fast track games, insert at the beginning
        newOrder = 1;
      }

      // Shift all games after the insertion point
      await db.run(sql`
        UPDATE games
        SET "order" = "order" + 1
        WHERE "order" >= ${newOrder}
      `);
    } else {
      // For non-fast track games, add to the end
      newOrder = allGames.length + 1;
    }

    // Insert the new game
    await db.insert(gamesTable).values({
      gameId,
      isFastTrack: isFastTrack ? 1 : 0,
      isCurrent: 0,
      order: newOrder,
    });

    // Fetch updated games
    const updatedGames = await db.select().from(gamesTable).orderBy(gamesTable.order);

    // Group games into rounds of 4
    const rounds = [];
    for (let i = 0; i < updatedGames.length; i += GAMES_PER_ROUND) {
      rounds.push({
        id: Math.floor(i / GAMES_PER_ROUND) + 1,
        roundNumber: Math.floor(i / GAMES_PER_ROUND) + 1,
        games: updatedGames.slice(i, i + GAMES_PER_ROUND)
      });
    }

    // Current round is empty by default
    const currentRound = [];

    return NextResponse.json({ rounds, currentRound });
  } catch (error) {
    console.error('Failed to add game:', error);
    return NextResponse.json({ error: 'Failed to add game: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Delete all games that are currently in the current round
    await db.delete(gamesTable).where(sql`${gamesTable.isCurrent} = 1`);

    // Fetch updated games
    const allGames = await db.select().from(gamesTable).orderBy(gamesTable.order);

    // Group games into rounds of 4
    const rounds = [];
    for (let i = 0; i < allGames.length; i += GAMES_PER_ROUND) {
      rounds.push({
        id: Math.floor(i / GAMES_PER_ROUND) + 1,
        roundNumber: Math.floor(i / GAMES_PER_ROUND) + 1,
        games: allGames.slice(i, i + GAMES_PER_ROUND)
      });
    }

    // Current round is now empty
    const currentRound = [];

    return NextResponse.json({ rounds, currentRound });
  } catch (error) {
    console.error('Failed to clear current round:', error);
    return NextResponse.json({ error: 'Failed to clear current round: ' + error.message }, { status: 500 });
  }
}