import type { PortfolioProject } from "./types";
import { isPortfolioProjectPubliclyEligible } from "./types";
import {
  getPortfolioPublicAssetUrl,
  getPortfolioPublicObjectKey,
  isValidPortfolioProjectSlug,
  isValidPortfolioPublicAssetId,
} from "./portfolio-storage";

export type PublicPortfolioAsset = {
  objectKey: string;
};

/**
 * Resolve um activo público exclusivamente a partir de metadados editoriais.
 * Nunca aceita uma chave R2 fornecida pelo navegador.
 */
export function resolvePublicPortfolioAsset(
  project: PortfolioProject | null,
  projectSlug: string,
  assetId: string
): PublicPortfolioAsset | null {
  if (
    !project ||
    project.slug !== projectSlug ||
    !isPortfolioProjectPubliclyEligible(project) ||
    !isValidPortfolioProjectSlug(projectSlug) ||
    !isValidPortfolioPublicAssetId(assetId)
  ) {
    return null;
  }

  const assetUrl = getPortfolioPublicAssetUrl(projectSlug, assetId);
  const isRegistered =
    project.coverImage === assetUrl || project.gallery.some((image) => image.src === assetUrl);

  if (!isRegistered) return null;

  const objectKey = getPortfolioPublicObjectKey(projectSlug, assetId);
  return objectKey ? { objectKey } : null;
}
