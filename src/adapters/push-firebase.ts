
import type { BatchResponse, TopicMessage } from "firebase-admin/messaging"


// import { APIError } from "payload"

import admin from 'firebase-admin'

import type { PushAdapter, SendPushOptions } from '../types/index.js'

type ServiceAccountJSONData = {
  auth_provider_x509_cert_url: string,
  auth_uri: string,
  client_email: string,
  client_id: string,
  client_x509_cert_url: string,
  private_key: string,
  private_key_id: string,
  project_id: string,
  token_uri: string,
  type: string,
  universe_domain: string,
}

export type FirebaseAdapterArgs = {
	serviceAccountJSON: ServiceAccountJSONData
}

type FirebasePushAdapter = PushAdapter<firebaseResponse>

type firebaseError = {
	error: {
		code: string
		message: string
	}
}

type firebaseResponse = { messageId: string } | BatchResponse | firebaseError



// export const firebaseAdapter = (args: firebaseAdapterArgs): FirebasePushAdapter => {
// 	const {
// 		apiKey,
// 		scheduledAt,
// 		firebaseUrl,
// 		variables,
// 	} = args

// 	const adapter: FirebasePushAdapter = () => ({
// 		name: "firebase",
// 		// defaultFromName,
// 		// defaultFromAddress,
// 		sendPush: async (message) => {
// 			const sendPushOptions = mapPayloadToFirebasePush(
// 				// defaultFromName,
// 				// defaultFromAddress,
// 				message
// 			)

// 			const payload = {
// 				...sendPushOptions,
// 				...(scheduledAt ? { scheduledAt } : {}),
// 				// ...(templateId ? { templateId } : {}),
// 				...(variables ? { variables } : {}),
// 			}

// 			const res = await fetch(`${firebaseUrl}/api/v1/emails`, {
// 				body: JSON.stringify(payload),
// 				headers: {
// 					Authorization: `Bearer ${apiKey}`,
// 					"Content-Type": "application/json",
// 				},
// 				method: "POST",
// 			})

// 			const data = (await res.json()) as firebaseResponse

// 			if ("emailId" in data) {
// 				return data
// 			}
//       else {
// 				const statusCode = res.status
// 				let formattedError = `Error sending email: ${statusCode}`
// 				if ("error" in data) {
// 					formattedError += ` ${data.error.code} - ${data.error.message}`
// 				}

// 				throw new APIError(formattedError, statusCode)
// 			}
// 		},
// 	})

/**
 * Push adapter for [firebase](https://firebase.com) Admin API
 */
export const firebaseAdapter = ({ serviceAccountJSON }: FirebaseAdapterArgs) => {
  // Initialize firebase-admin if not already done
  if (!admin.apps.length) {
    if (!serviceAccountJSON) {
      throw new Error('Missing service account json data')
    }

    const creds = serviceAccountJSON || undefined

    try{
      admin.initializeApp({
        credential: creds
          ? admin.credential.cert(creds as admin.ServiceAccount)
          : admin.credential.applicationDefault(),
      })
      console.log('✅ Firebase admin app initialized', admin.app().name)
    }
    catch(e){
      console.error(e)
      console.log('❌ Firebase admin app initialized failed', e)
    }
  }

  const fcm = admin.messaging()

  const adapter: FirebasePushAdapter = () => ({
    name: 'firebase-admin',
    /**
     * Sends push notifications using Firebase Admin SDK
     */
    async sendPush(message: {
      body: string
      data?: Record<string, string>
      options?: Record<string, string>
      title: string
    }) {
      const sendPushOptions = mapPayloadToFirebasePush(message)

      const notification = {
        body: message.body,
        title: message.title,
      }

      console.log({sendPushOptions})

     try {
      if(sendPushOptions.topic) {
        const payload: TopicMessage = {
          data: message.data,
          notification,
          topic: sendPushOptions.topic,
        }

        const res = await fcm.send(payload)
        console.log('✅ Push to single token:', res)
          if(res){
          return { messageId: res}
        }
      }
      if(sendPushOptions.tokens && sendPushOptions.tokens.length){
        const res = await fcm.sendEachForMulticast({
            data: message.data,
            notification,
            tokens: sendPushOptions.tokens,
          })
          console.log('✅ Push multicast result:', res)
          return res
      }

        if(sendPushOptions.token){
          const res = await fcm.send({
            data: message.data,
            notification,
            token: sendPushOptions.token,
          })
          console.log('✅ Push to token:', res)

          return { messageId: res}
       }

        throw new Error('No token(s) or topic provided')
      } catch (err) {
        console.error('❌ Firebase push error:', err)
        throw err
      }
    },
  })
  return adapter
}

function mapPayloadToFirebasePush(
	message: SendPushOptions
): firebasePushOptions {
	const pushOptions: Partial<firebasePushOptions> = {
    body: message.body,
    title: message.title,
	}

  if(!message.options){
    return pushOptions as firebasePushOptions;
  }

  if(message.options['token']){
    const token = message.options['token']
    pushOptions.token = token
  }

  if(message.options['tokens']){
    const tokens = message.options['tokens']
    pushOptions.tokens = tokens
  }

  if(message.options['topic']){
    const topic = message.options['topic']
    pushOptions.topic = topic
  }

  if(message.options['android']){
    const android = message.options['android']
    pushOptions.android = android
  }

  if(message.options['apns']){
    const apns = message.options['apns']
    pushOptions.apns = apns
  }

	// if (message.text?.toString().trim().length > 0) {
	// 	pushOptions.text = message.text
	// } else {
	// 	pushOptions.text = "Please view this email in an HTML-compatible client."
	// }

	// if (message.html?.toString().trim()) {
	// 	pushOptions.html = message.html.toString()
	// }

	// if (message.attachments?.length) {
	// 	if (message.attachments.length > 10) {
	// 		throw new APIError("Maximum of 10 attachments allowed", 400)
	// 	}
	// 	pushOptions.attachments = mapAttachments(message.attachments)
	// }

	// if (message.replyTo) {
	// 	pushOptions.replyTo = mapAddresses(message.replyTo)
	// }

	// if (message.cc) {
	// 	pushOptions.cc = mapAddresses(message.cc)
	// }

	// if (message.bcc) {
	// 	pushOptions.bcc = mapAddresses(message.bcc)
	// }

	return pushOptions as firebasePushOptions
}

// function mapFromAddress(
// 	address: SendPushOptions["from"],
// 	defaultFromName: string,
// 	defaultFromAddress: string
// ): firebasePushOptions["from"] {
// 	if (!address) {
// 		return `${defaultFromName} <${defaultFromAddress}>`
// 	}

// 	if (typeof address === "string") {
// 		return address
// 	}

// 	return `${address.name} <${address.address}>`
// }

// function mapAddresses(
// 	addresses: SendPushOptions["to"]
// ): firebasePushOptions["to"] {
// 	if (!addresses) {
// 		return ""
// 	}

// 	if (typeof addresses === "string") {
// 		return addresses
// 	}

// 	if (Array.isArray(addresses)) {
// 		return addresses.map((address) =>
// 			typeof address === "string" ? address : address.address
// 		)
// 	}

// 	return [addresses.address]
// }

// function mapAttachments(
// 	attachments: SendPushOptions["attachments"]
// ): firebasePushOptions["attachments"] {
// 	if (!attachments) {
// 		return []
// 	}

// 	if (attachments.length > 10) {
// 		throw new APIError("Maximum of 10 attachments allowed", 400)
// 	}

// 	return attachments.map((attachment) => {
// 		if (!attachment.filename || !attachment.content) {
// 			throw new APIError("Attachment is missing filename or content", 400)
// 		}

// 		if (typeof attachment.content === "string") {
// 			return {
// 				content: Buffer.from(attachment.content).toString("base64"),
// 				filename: attachment.filename,
// 			}
// 		}

// 		if (attachment.content instanceof Buffer) {
// 			return {
// 				content: attachment.content.toString("base64"),
// 				filename: attachment.filename,
// 			}
// 		}

// 		throw new APIError("Attachment content must be a string or a buffer", 400)
// 	})
// }

type firebasePushOptions = {
	android?: admin.messaging.AndroidConfig
	apns?: admin.messaging.ApnsConfig
  body: string
  /**
	 * The date and time to send the email. If not provided, the email will be sent immediately.
	 */
	scheduledAt?: string
  title: string
  token?: string
  tokens?: string[]

	topic?: string
}

// type Attachment = {
// 	/** Content of an attached file. */
// 	content: string
// 	/** Name of attached file. */
// 	filename: string
// }
