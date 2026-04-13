interface FirestoreWriteErrorOptions {
  fallback: string;
  permissionDenied?: string;
  notFound?: string;
}

function getFirestoreErrorCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code ?? '')
    : '';
}

function getFirestoreErrorText(error: unknown) {
  return error instanceof Error ? error.message.toLowerCase() : '';
}

export function isRetryableFirestoreError(error: unknown) {
  const code = getFirestoreErrorCode(error);
  const message = getFirestoreErrorText(error);

  return (
    code.includes('resource-exhausted')
    || code.includes('unavailable')
    || code.includes('deadline-exceeded')
    || code.includes('internal')
    || message.includes('quota')
    || message.includes('limit')
    || message.includes('network')
    || message.includes('offline')
  );
}

export function getFirestoreWriteErrorMessage(
  error: unknown,
  options: FirestoreWriteErrorOptions,
) {
  const code = getFirestoreErrorCode(error);

  if (code === 'client-state' && error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (isRetryableFirestoreError(error)) {
    return options.fallback;
  }

  if (code.includes('permission-denied')) {
    return options.permissionDenied ?? 'Backend rejected the update. Please sign in again and retry.';
  }

  if (code.includes('not-found')) {
    return options.notFound ?? 'Requested record was not found in backend. Refresh the page and retry.';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Backend sync failed. Please retry.';
}
