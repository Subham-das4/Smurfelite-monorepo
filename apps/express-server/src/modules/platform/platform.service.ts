import prisma from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import { PlatformErrors } from "./platform.messages.js";
import { slugifyName } from "../game/game.service.js";

async function ensureUniqueSlug(baseSlug: string, excludeId?: string) {
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const existing = await prisma.platform.findFirst({
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

export async function getAllPlatforms() {
  return prisma.platform.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getPlatformById(id: string) {
  const platform = await prisma.platform.findUnique({ where: { id } });
  if (!platform) {
    throw new ApiError(PlatformErrors.NOT_FOUND, 404);
  }
  return platform;
}

export async function createPlatform(data: { name: string; slug?: string }) {
  const baseSlug = data.slug?.trim() || slugifyName(data.name);
  if (!baseSlug) {
    throw new ApiError("Platform slug could not be generated.", 400);
  }
  const slug = await ensureUniqueSlug(baseSlug);

  try {
    return await prisma.platform.create({
      data: { name: data.name.trim(), slug },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new ApiError(PlatformErrors.SLUG_EXISTS, 409);
    }
    throw err;
  }
}

export async function updatePlatform(
  id: string,
  data: { name?: string; slug?: string }
) {
  await getPlatformById(id);

  const update: { name?: string; slug?: string } = {};
  if (data.name !== undefined) update.name = data.name.trim();
  if (data.slug !== undefined) {
    update.slug = await ensureUniqueSlug(data.slug.trim(), id);
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError("No valid fields to update.", 400);
  }

  try {
    return await prisma.platform.update({
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
      throw new ApiError(PlatformErrors.SLUG_EXISTS, 409);
    }
    throw err;
  }
}

export async function deletePlatform(id: string) {
  await getPlatformById(id);

  const productCount = await prisma.product.count({
    where: { platformId: id },
  });
  if (productCount > 0) {
    throw new ApiError(PlatformErrors.HAS_PRODUCTS, 409);
  }

  await prisma.platform.delete({ where: { id } });
}

export async function setPlatformRestricted(
  id: string,
  isRestricted?: boolean
) {
  const platform = await getPlatformById(id);
  const nextRestricted =
    isRestricted !== undefined ? isRestricted : !platform.isRestricted;

  return prisma.platform.update({
    where: { id },
    data: { isRestricted: nextRestricted },
  });
}

/** Block new listings when platform is restricted. */
export async function assertPlatformAllowsNewListing(options: {
  platformId?: string | null;
  platform?: string;
}) {
  const { platformId, platform } = options;

  if (platformId) {
    const record = await prisma.platform.findUnique({
      where: { id: platformId },
    });
    if (!record) {
      throw new ApiError(PlatformErrors.NOT_FOUND, 404);
    }
    if (record.isRestricted) {
      throw new ApiError(PlatformErrors.RESTRICTED, 400);
    }
    return record;
  }

  if (platform?.trim()) {
    const restricted = await prisma.platform.findFirst({
      where: {
        name: { equals: platform.trim(), mode: "insensitive" },
        isRestricted: true,
      },
    });
    if (restricted) {
      throw new ApiError(PlatformErrors.RESTRICTED, 400);
    }
  }

  return null;
}
