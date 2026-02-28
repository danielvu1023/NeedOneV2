// Stub type declarations for web-push (optional dependency)
// Install with: npm install web-push && npm install -D @types/web-push
declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  export function sendNotification(subscription: PushSubscription, payload: string): Promise<unknown>
}
