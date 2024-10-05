import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gamesTable } from '@/db/schema';
import { sql, and, gte, lt } from 'drizzle-orm';

const GAMES_PER_ROUND = 4;

export async function POST(request) {
  const { id } = await request.json();

  try {
    // Calculate the start and end order for the selected round
    const startOrder = (id - 1) * GAMES_PER_ROUND + 1;
    const endOrder = id * GAMES_PER_ROUND;

    // Set all games to not current
    await db.update(gamesTable).set({ isCurrent: 0 });

    // Move selected games to current round
    await db.update(gamesTable)
      .set({ isCurrent: 1 })
      .where(and(
        gte(gamesTable.order, startOrder),
        lt(gamesTable.order, endOrder + 1)
      ));

    // Shift the order of remaining games
    await db.run(sql`
      UPDATE games
      SET "order" = "order" - ${GAMES_PER_ROUND}
      WHERE "order" > ${endOrder}
    `);

    // Fetch updated games
    const allGames = await db.select().from(gamesTable).orderBy(gamesTable.order);

    // Group non-current games into rounds of 4
    const rounds = [];
    let roundCounter = 1;
    const nonCurrentGames = allGames.filter(game => game.isCurrent === 0);
    for (let i = 0; i < nonCurrentGames.length; i += GAMES_PER_ROUND) {
      const roundGames = nonCurrentGames.slice(i, i + GAMES_PER_ROUND);
      if (roundGames.length > 0) {
        rounds.push({
          id: roundCounter,
          roundNumber: roundCounter,
          games: roundGames
        });
        roundCounter++;
      }
    }

    // Get current round (games where isCurrent is 1)
    const currentRound = allGames.filter(game => game.isCurrent === 1);

    return NextResponse.json({ rounds, currentRound });
  } catch (error) {
    console.error('Failed to move round to current:', error);
    return NextResponse.json({ error: 'Failed to move round to current: ' + error.message }, { status: 500 });
  }
}