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

    // Add this part to fetch archived rounds
    const archivedGames = await db.select()
      .from(gamesTable)
      .where(and(eq(gamesTable.userId, userId), eq(gamesTable.isArchived, 1)))
      .orderBy(gamesTable.order);

    console.log('Archived games:', archivedGames); // Add this line

    const archivedRounds = archivedGames.reduce((acc, game) => {
      const archivedAt = game.archivedAt || 'unknown';
      if (!acc[archivedAt]) acc[archivedAt] = [];
      acc[archivedAt].push(game);
      return acc;
    }, {});

    console.log('Grouped archived rounds:', archivedRounds); // Add this line

    return NextResponse.json({
      rounds: rounds || [],
      currentRound: currentGames || [],
      archivedRounds: archivedRounds || [],
    });
  } catch (error) {
    console.error('Error in GET /api/rounds:', error);
    return NextResponse.json({ error: 'Internal Server Error', rounds: [], currentRound: [], archivedRounds: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { gameId, isFastTrack } = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    console.log('Received token in POST:', token);

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyAuth(token);
    console.log('Decoded token in POST:', decoded);

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

    // Add the new game to the regular round list (not current)
    await db.insert(gamesTable).values({
      userId,
      gameId,
      isFastTrack: isFastTrack ? 1 : 0,
      isCurrent: 0, // Set to 0 to add to regular round list
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
    console.log('DELETE request received to clear current round');

    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyAuth(token);
    if (!decoded) {
      console.log('Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('User ID:', userId);

    const currentTimestamp = new Date().toISOString();

    // Update all current games to non-current, archived, and set the archived timestamp
    const updateResult = await db.update(gamesTable)
      .set({ isCurrent: 0, isArchived: 1, archivedAt: currentTimestamp })
      .where(and(eq(gamesTable.userId, userId), eq(gamesTable.isCurrent, 1)));

    console.log('Update result:', updateResult);

    // Fetch updated games
    const updatedGames = await db.select().from(gamesTable).where(eq(gamesTable.userId, userId));
    console.log('Updated games:', updatedGames);

    // Group games into rounds (non-current games)
    const rounds = updatedGames
      .filter(game => !game.isCurrent && !game.isArchived)
      .reduce((acc, game) => {
        const roundIndex = Math.floor(game.order / 4);
        if (!acc[roundIndex]) acc[roundIndex] = [];
        acc[roundIndex].push(game);
        return acc;
      }, []);

    // Group archived games
    const archivedRounds = updatedGames
      .filter(game => game.isArchived)
      .reduce((acc, game) => {
        const archivedAt = game.archivedAt;
        if (!acc[archivedAt]) acc[archivedAt] = [];
        acc[archivedAt].push(game);
        return acc;
      }, {});

    console.log('Grouped rounds:', rounds);
    console.log('Archived rounds:', archivedRounds);

    const response = {
      rounds: rounds || [],
      currentRound: [],
      archivedRounds: archivedRounds || {},
    };

    console.log('Sending response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to clear current round:', error);
    return NextResponse.json({ error: 'Failed to clear current round: ' + error.message, rounds: [], currentRound: [], archivedRounds: {} }, { status: 500 });
  }
}