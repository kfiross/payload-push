import type { Payload } from 'payload'
// type Prettify<T> = {
//     [K in keyof T]: T[K];
// } & NonNullable<unknown>;

/**
 * Options for sending an push notification. Allows access to the PayloadRequest object
 */
export type SendPushOptions = {
  title: string
  body: string
  data?: Record<string, any>
  options?: Record<string, any>
}
//Prettify<Nodpush notificationerSendMailOptions>;
/**
 * Email adapter after it has been initialized. This is used internally by Payload.
 */
export type InitializedPushAdapter<TSendPushResponse = unknown> = ReturnType<
  PushAdapter<TSendPushResponse>
>
/**
 * Push adapter interface. Allows a generic type for the response of the sendEmail method.
 *
 * This is the interface to use if you are creating a new push notification adapter.
 */
export type PushAdapter<TSendPushResponse = unknown> = ({ payload }: { payload: Payload }) => {
  // defaultFromAddress: string;
  // defaultFromName: string;
  name: string
  sendPush: (message: SendPushOptions) => Promise<TSendPushResponse>
}
export {}
