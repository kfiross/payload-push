import type { payloadPush } from '../payloadPush.js'
import { BasePayload } from 'payload'

declare module 'payload' {
  interface BasePayload {
    /**
     * Custom push method added to the Payload instance
     */
    push: typeof payloadPush.sendPush
  }
}
