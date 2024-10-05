import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamesTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyAuth(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { timestamp } = await request.json();
    if (!timestamp) {
      return NextResponse.json({ error: 'No timestamp provided' }, { status: 400 });
    }

    const userId = decoded.userId;

    // Log the query parameters
    console.log('Attempting to delete archived games with:', { userId, timestamp });

    // First, check if any matching games exist
    const matchingGames = await db.select({ id: gamesTable.id })
      .from(gamesTable)
      .where(
        and(
          eq(gamesTable.userId, userId),
          eq(gamesTable.isArchived, 1),
          eq(gamesTable.archivedAt, timestamp)
        )
      );

    console.log('Matching games:', matchingGames);

    if (matchingGames.length === 0) {
      return NextResponse.json({ error: 'No matching archived rounds found', details: { userId, timestamp } }, { status: 404 });
    }

    // Delete the archived games for the given timestamp
    const deleteResult = await db.delete(gamesTable)
      .where(
        and(
          eq(gamesTable.userId, userId),
          eq(gamesTable.isArchived, 1),
          eq(gamesTable.archivedAt, timestamp)
        )
      );

    console.log('Delete result:', deleteResult);

    return NextResponse.json({ message: 'Archived round deleted successfully', deletedCount: deleteResult.rowsAffected });
  } catch (error) {
    console.error('Failed to delete archived round:', error);
    return NextResponse.json({ error: 'Failed to delete archived round: ' + error.message }, { status: 500 });
  }
}