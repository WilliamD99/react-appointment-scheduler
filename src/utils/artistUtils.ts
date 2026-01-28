import type { Artist, Technician } from '../types/scheduler';

/**
 * Gets the technician/artist ID from an appointment's artist field.
 * Supports both string (legacy) and object { id, name } shape.
 */
export function getArtistId(artist: Artist | undefined): string | undefined {
  if (artist == null) return undefined;
  if (typeof artist === 'string') return artist;
  return artist.id;
}

/**
 * Gets a display name for the artist.
 * - Object: uses artist.name or artist.id
 * - String: uses technicians lookup if provided, otherwise the string
 */
export function getArtistDisplayName(
  artist: Artist | undefined,
  technicians?: Technician[]
): string {
  if (artist == null) return '';
  if (typeof artist === 'object') return artist.name ?? artist.id ?? '';
  if (technicians?.length) {
    const t = technicians.find((x) => x.id === artist);
    return t?.name ?? artist;
  }
  return artist;
}
