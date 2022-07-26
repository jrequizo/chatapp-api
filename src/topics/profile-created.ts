import { z } from 'zod';
import { Message } from '@google-cloud/pubsub';

import { fAdminApp } from '@/utils/gcloud/firebase'

const profilesRef = fAdminApp.firestore().collection("profiles")

/**
 * Zod schema validator for incoming Message data.
 */
const AccountData = z.object({
	uid: z.string(),
	username: z.string()
})

type AccountData = z.infer<typeof AccountData>

/**
 * Function callback used when a Message is pushed to the `profile-created` Topic on Google PubSub.
 * @param message The message being received from Google PubSub
 */
export async function onProfileCreated(message: Message) {
	/**
	 * Required to stop the Message from being consumed by other services using the same Subscription.
	 * Also stops the Message from being re-pushed (PubSub thinking the Message hasn't been seen).
	 * 
	 * Only used with Google PubSub.
	 */
	message.ack()

	
	// Retrieves the Message from the Buffer and transforms it into a JSON object which is then validated using the Zod schema above.
	const accountData = AccountData.parse(JSON.parse(Buffer.from(message.data).toString()))
	
	// Create a new document on Google Firestore using the `uid` provided by `firebase/auth` as the document `uid`.
	await profilesRef.doc(accountData.uid).set({
		uid: accountData.uid,
		username: accountData.username,
		about: "",
		pfp_url: ""
	})
}

/**
 * Temporary callback function used with `EventEmitter` for in-app event-driven communication.
 * @param message The message being received from Google PubSub
 */
 export async function onProfileCreatedEvent(data: {uid: string, username: string}) {
	// Create a new document on Google Firestore using the `uid` provided by `firebase/auth` as the document `uid`.
	await profilesRef.doc(data.uid).set({
		uid: data.uid,
		username: data.username,
		about: "",
		pfp_url: ""
	})
}