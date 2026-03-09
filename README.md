# PayloadCMS Push Plugin

The **PayloadCMS Push Plugin** provides a unified interface for sending
push notifications from within Payload applications.

It is designed as an extensible, adapter-based system that supports
multiple push providers. Currently, the plugin includes a **Firebase
adapter** powered by the Firebase Admin SDK and Firebase Cloud Messaging
(FCM), with additional providers planned for future releases (such as
OneSignal).

------------------------------------------------------------------------

## Available Adapters

### Firebase (FCM)

The Firebase Push Adapter integrates **PayloadCMS** with **Firebase
Cloud Messaging (FCM)** using the official Firebase Admin SDK. It
enables transactional and broadcast push notification workflows across
web, iOS, and Android devices.

Built on top of Firebase and Firebase Cloud Messaging (FCM), this
adapter allows teams to send:

-   Single-device notifications
-   Multicast push notifications
-   Topic-based broadcast notifications
-   Platform-specific (Android / APNs) configurations

By leveraging the Firebase Admin SDK, organisations retain full control
over credentials, infrastructure, and deployment topology while
simplifying push delivery from within Payload.

------------------------------------------------------------------------

## Roadmap

The plugin is designed to support multiple providers through adapters.
Planned integrations may include:

-  OneSignal
-  Additional self-hosted or API-first push services
-  Requested by community

------------------------------------------------------------------------

## Installation

``` sh
pnpm add @kfiross44/payload-push
```

------------------------------------------------------------------------

## Prerequisites

### Firebase Adapter 

1.  Create a Firebase project
2.  Enable Firebase Cloud Messaging (FCM)
3.  Generate a **Service Account Key (JSON)**
4.  Store the service account JSON securely (environment variable or
    secret manager)

------------------------------------------------------------------------

## Usage

### Firebase Adapter

All data should based on your generated JSON file (`project-id-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`) from Firebase Console
``` ts
// payload.config.ts
import { buildConfig } from 'payload'
import { firebaseAdapter } from '@kfiross/payload-push'

export default buildConfig({
  plugins: [
      // ... other plugins configuration
      
      payloadPushPlugin({
        firebaseAdapter({
          serviceAccountJSON: {
            type: "service_account",
            project_id: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID!,
            private_key_id: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID!,
            private_key: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY!,
            client_email: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL!,
            client_id: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_ID!,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40rescue-263a6.iam.gserviceaccount.com",
            universe_domain: "googleapis.com"
          }
        }),
      }),
    ],
})
```

------------------------------------------------------------------------

## Examples

### Firebase Adapter
* Sending a Push Notification
``` ts
await payload.push.send({
  title: 'New Booking Confirmed',
  body: 'Your booking has been successfully confirmed.',
  data: {
    bookingId: '12345',
  },
  options: {
    token: '<device-fcm-token>',
  },
})
```

* Sending to Multiple Devices

``` ts
await payload.push.send({
  title: 'System Update',
  body: 'We have updated our terms of service.',
  options: {
    tokens: ['token-1', 'token-2'],
  },
})
```

* Sending to a Topic

``` ts
await payload.push.send({
  title: 'Weekly Newsletter',
  body: 'Check out what’s new this week!',
  options: {
    topic: 'weekly-updates',
  },
})
```

------------------------------------------------------------------------

## Configuration

### Firebase Adapter

| Option             | Type   | Required | Default | Description                               |
|--------------------|--------|----------|---------|-------------------------------------------|
| serviceAccountJSON             | string | Yes      | -       | Firebase service account credentials JSON |



Inside `options`, you may provide:

| Option               | Type     | Description            |
|----------------------|----------|------------------------|
| token   | string   | Single device token    |
| tokens   | string[] | Multiple device tokens |
| topic   | string   | Subscribed topic name  |
| android   | object   | Android-specific FCM config    |
| apns   | object   | iOS/APNs-specific config    |

------------------------------------------------------------------------

## Example Environment Variable Setup

You may define (for FCM for example): 
``` bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ...}'
```

------------------------------------------------------------------------

## License

This project is licensed under the MIT License.
