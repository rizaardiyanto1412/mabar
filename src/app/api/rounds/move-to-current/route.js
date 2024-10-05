import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamesTable } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyAuth(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const { id } = await request.json();

    console.log('Received round ID:', id); // Add this log

    if (typeof id !== 'number' || !Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: 'Invalid round ID' }, { status: 400 });
    }

    // Calculate the order range for the specified round
    const startOrder = (id - 1) * 4;
    const endOrder = id * 4;

    // Update the specified round to be current
    await db.update(gamesTable)
      .set({ isCurrent: 1 })
      .where(
        and(
          eq(gamesTable.userId, userId),
          gte(gamesTable.order, startOrder),
          lt(gamesTable.order, endOrder)
        )
      );

    // Fetch updated games
    const updatedGames = await db.select().from(gamesTable).where(eq(gamesTable.userId, userId));

    // Group games into rounds
    const rounds = updatedGames.reduce((acc, game) => {
      const roundIndex = Math.floor(game.order / 4);
      if (!acc[roundIndex]) acc[roundIndex] = [];
      acc[roundIndex].push(game);
      return acc;
    }, []);

    // Get current games
    const currentGames = updatedGames.filter(game => game.isCurrent);

    console.log('Updated rounds:', rounds); // Add this log
    console.log('Current games:', currentGames); // Add this log

    return NextResponse.json({
      rounds: rounds,
      currentRound: currentGames,
    });
  } catch (error) {
    console.error('Failed to move round to current:', error);
    return NextResponse.json({ error: 'Failed to move round to current: ' + error.message }, { status: 500 });
  }
}