import type { SmokeContext } from "./runner.mts";
import { apiRequest } from "./http.mts";

type CatalogItem = { id: string; isRestricted: boolean };

export async function getSmokeGameAndPlatformIds(
  ctx: SmokeContext
): Promise<{ gameId: string; platformId: string }> {
  const { data: gamesData } = await apiRequest<{ games: CatalogItem[] }>(
    ctx,
    "/games",
    { expectStatus: 200 }
  );
  const { data: platformsData } = await apiRequest<{ platforms: CatalogItem[] }>(
    ctx,
    "/platforms",
    { expectStatus: 200 }
  );

  const game = gamesData.games.find((g) => !g.isRestricted);
  const platform = platformsData.platforms.find((p) => !p.isRestricted);

  if (!game?.id || !platform?.id) {
    throw new Error(
      "No unrestricted game/platform available for smoke tests. Seed games and platforms first."
    );
  }

  return { gameId: game.id, platformId: platform.id };
}
