export function reportSnapshotError(scope: string, error: unknown) {
  console.error(`[firestore:${scope}] live snapshot failed`, error);
}

export const LIVE_SYNC_WARNING = 'Live sync is temporarily unavailable. Showing the last loaded records.';
