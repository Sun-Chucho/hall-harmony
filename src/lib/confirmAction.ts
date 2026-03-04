export function confirmAction(message = 'Are you sure you want to continue?') {
  if (typeof window === 'undefined') return true;
  return window.confirm(message);
}
