import PocketBase from 'pocketbase'

export function createPocketBaseClient(apiUrl: string): PocketBase {
  const pb = new PocketBase(apiUrl)
  pb.autoCancellation(false)
  return pb
}
