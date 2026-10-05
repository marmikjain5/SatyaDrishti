export function getNetworkStatusLabel(isOnline: boolean): 'Online' | 'Offline' {
  return isOnline ? 'Online' : 'Offline';
}
