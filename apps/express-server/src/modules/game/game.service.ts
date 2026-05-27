import prisma from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import { GameErrors } from "./game.messages.js";

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string) {
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const existing = await prisma.game.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function getAllGames() {
  return prisma.game.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getGameById(id: string) {
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    throw new ApiError(GameErrors.NOT_FOUND, 404);
  }
  return game;
}

export async function createGame(data: { name: string; slug?: string }) {
  const baseSlug = data.slug?.trim() || slugifyName(data.name);
  if (!baseSlug) {
    throw new ApiError("Game slug could not be generated.", 400);
  }
  const slug = await ensureUniqueSlug(baseSlug);

  try {
    return await prisma.game.create({
      data: { name: data.name.trim(), slug },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new ApiError(GameErrors.SLUG_EXISTS, 409);
    }
    throw err;
  }
}

export async function updateGame(
  id: string,
  data: { name?: string; slug?: string }
) {
  await getGameById(id);

  const update: { name?: string; slug?: string } = {};
  if (data.name !== undefined) update.name = data.name.trim();
  if (data.slug !== undefined) {
    update.slug = await ensureUniqueSlug(data.slug.trim(), id);
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError("No valid fields to update.", 400);
  }

  try {
    return await prisma.game.update({
      where: { id },
      data: update,
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new ApiError(GameErrors.SLUG_EXISTS, 409);
    }
    throw err;
  }
}

export async function deleteGame(id: string) {
  await getGameById(id);

  const productCount = await prisma.product.count({
    where: { gameId: id },
  });
  if (productCount > 0) {
    throw new ApiError(GameErrors.HAS_PRODUCTS, 409);
  }

  await prisma.game.delete({ where: { id } });
}

export async function setGameRestricted(id: string, isRestricted?: boolean) {
  const game = await getGameById(id);
  const nextRestricted =
    isRestricted !== undefined ? isRestricted : !game.isRestricted;

  return prisma.game.update({
    where: { id },
    data: { isRestricted: nextRestricted },
  });
}

/** Block new listings when game is restricted (by id or matching gameType name). */
export async function assertGameAllowsNewListing(options: {
  gameId?: string | null;
  gameType?: string;
}) {
  const { gameId, gameType } = options;

  if (gameId) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });
    if (!game) {
      throw new ApiError(GameErrors.NOT_FOUND, 404);
    }
    if (game.isRestricted) {
      throw new ApiError(GameErrors.RESTRICTED, 400);
    }
    return game;
  }

  if (gameType?.trim()) {
    const restricted = await prisma.game.findFirst({
      where: {
        name: { equals: gameType.trim(), mode: "insensitive" },
        isRestricted: true,
      },
    });
    if (restricted) {
      throw new ApiError(GameErrors.RESTRICTED, 400);
    }
  }

  return null;
}
