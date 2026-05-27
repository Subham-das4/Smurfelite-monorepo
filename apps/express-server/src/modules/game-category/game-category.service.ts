import prisma from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import { GameCategoryErrors } from "./game-category.messages.js";

export function slugifyCategoryName(name: string): string {
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
    const existing = await prisma.gameCategory.findFirst({
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

export async function getAllGameCategories() {
  return prisma.gameCategory.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getGameCategoryById(id: string) {
  const category = await prisma.gameCategory.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(GameCategoryErrors.NOT_FOUND, 404);
  }
  return category;
}

export async function createGameCategory(data: { name: string; slug?: string }) {
  const baseSlug = data.slug?.trim() || slugifyCategoryName(data.name);
  if (!baseSlug) {
    throw new ApiError("Category slug could not be generated.", 400);
  }
  const slug = await ensureUniqueSlug(baseSlug);

  try {
    return await prisma.gameCategory.create({
      data: { name: data.name.trim(), slug },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new ApiError(GameCategoryErrors.SLUG_EXISTS, 409);
    }
    throw err;
  }
}

export async function updateGameCategory(
  id: string,
  data: { name?: string; slug?: string }
) {
  await getGameCategoryById(id);

  const update: { name?: string; slug?: string } = {};
  if (data.name !== undefined) update.name = data.name.trim();
  if (data.slug !== undefined) {
    update.slug = await ensureUniqueSlug(data.slug.trim(), id);
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError("No valid fields to update.", 400);
  }

  try {
    return await prisma.gameCategory.update({
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
      throw new ApiError(GameCategoryErrors.SLUG_EXISTS, 409);
    }
    throw err;
  }
}

export async function deleteGameCategory(id: string) {
  await getGameCategoryById(id);

  const productCount = await prisma.product.count({
    where: { gameCategoryId: id },
  });
  if (productCount > 0) {
    throw new ApiError(GameCategoryErrors.HAS_PRODUCTS, 409);
  }

  await prisma.gameCategory.delete({ where: { id } });
}

export async function setGameCategoryRestricted(
  id: string,
  isRestricted?: boolean
) {
  const category = await getGameCategoryById(id);
  const nextRestricted =
    isRestricted !== undefined ? isRestricted : !category.isRestricted;

  return prisma.gameCategory.update({
    where: { id },
    data: { isRestricted: nextRestricted },
  });
}

/** Block new listings when category is restricted (by id or matching gameType name). */
export async function assertCategoryAllowsNewListing(options: {
  gameCategoryId?: string | null;
  gameType?: string;
}) {
  const { gameCategoryId, gameType } = options;

  if (gameCategoryId) {
    const category = await prisma.gameCategory.findUnique({
      where: { id: gameCategoryId },
    });
    if (!category) {
      throw new ApiError(GameCategoryErrors.NOT_FOUND, 404);
    }
    if (category.isRestricted) {
      throw new ApiError(GameCategoryErrors.RESTRICTED, 400);
    }
    return category;
  }

  if (gameType?.trim()) {
    const restricted = await prisma.gameCategory.findFirst({
      where: {
        name: { equals: gameType.trim(), mode: "insensitive" },
        isRestricted: true,
      },
    });
    if (restricted) {
      throw new ApiError(GameCategoryErrors.RESTRICTED, 400);
    }
  }

  return null;
}
