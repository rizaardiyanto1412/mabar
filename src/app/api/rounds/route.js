import { NextResponse } from 'next/server';
import { db } from '@/db';
import { usersTable, gamesTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    console.log('Received token:', token);

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyAuth(token);
    console.log('Decoded token:', decoded);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Fetch all games for the user
    const userGames = await db.select().from(gamesTable).where(eq(gamesTable.userId, userId));

    // Group games into rounds (non-current games)
    const rounds = userGames
      .filter(game => !game.isCurrent)
      .reduce((acc, game) => {
        const roundIndex = Math.floor(game.order / 4);
        if (!acc[roundIndex]) acc[roundIndex] = [];
        acc[roundIndex].push(game);
        return acc;
      }, []);

    // Get current games
    const currentGames = userGames.filter(game => game.isCurrent);

    return NextResponse.json({
      rounds: rounds,
      currentRound: currentGames,
    });
  } catch (error) {
    console.error('Error in GET /api/rounds:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { gameId, isFastTrack } = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    console.log('Received token in POST:', token); // Debug log

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyAuth(token);
    console.log('Decoded token in POST:', decoded); // Debug log

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get the current highest order for the user's games
    const [lastGame] = await db
      .select({ maxOrder: gamesTable.order })
      .from(gamesTable)
      .where(eq(gamesTable.userId, userId))
      .orderBy(gamesTable.order, 'desc')
      .limit(1);

    const newOrder = (lastGame?.maxOrder ?? -1) + 1;

    // Add the new game
    await db.insert(gamesTable).values({
      userId,
      gameId,
      isFastTrack: isFastTrack ? 1 : 0,
      isCurrent: 1,
      order: newOrder,
    });

    // Fetch updated games
    const updatedGames = await db.select().from(gamesTable).where(eq(gamesTable.userId, userId));

    // Group games into rounds (non-current games)
    const rounds = updatedGames
      .filter(game => !game.isCurrent)
      .reduce((acc, game) => {
        const roundIndex = Math.floor(game.order / 4);
        if (!acc[roundIndex]) acc[roundIndex] = [];
        acc[roundIndex].push(game);
        return acc;
      }, []);

    // Get current games
    const currentGames = updatedGames.filter(game => game.isCurrent);

    return NextResponse.json({
      rounds: rounds,
      currentRound: currentGames,
    });
  } catch (error) {
    console.error('Failed to add game:', error);
    return NextResponse.json({ error: 'Failed to add game: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyAuth(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    // Update all current games to non-current
    await db.update(gamesTable)
      .set({ isCurrent: 0 })
      .where(and(eq(gamesTable.userId, userId), eq(gamesTable.isCurrent, 1)));

    // Fetch updated games
    const updatedGames = await db.select().from(gamesTable).where(eq(gamesTable.userId, userId));

    // Group games into rounds (non-current games)
    const rounds = updatedGames
      .filter(game => !game.isCurrent)
      .reduce((acc, game) => {
        const roundIndex = Math.floor(game.order / 4);
        if (!acc[roundIndex]) acc[roundIndex] = [];
        acc[roundIndex].push(game);
        return acc;
      }, []);

    return NextResponse.json({
      rounds: rounds,
      currentRound: [],
    });
  } catch (error) {
    console.error('Failed to clear current round:', error);
    return NextResponse.json({ error: 'Failed to clear current round: ' + error.message }, { status: 500 });
  }
}