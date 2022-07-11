import * as trpc from "@trpc/server"

import { fAdminApp } from "@/utils/gcloud/firebase"
import { z } from "zod"

const firestore = fAdminApp.firestore()
const publicChatsCollection = firestore.collection("public-chats")

/**
 * 	Helper interface to transform the `firebase/firestore` data.
 */
const ChatInfo = z.object({
	id: z.string(),
	name: z.string()
})
type ChatInfo = z.infer<typeof ChatInfo>

/**
 * 	Route to retrieve the `id` and `name` of all Public Chats.
 */
export const router = trpc.router()
.query("publicChats", {
	async resolve() {
		// Retrieve Public Chat information from `firebase/firestore`.
		const result = await publicChatsCollection.get()

		// Map the objects to an array.
		let chats : Array<ChatInfo> = result.docs.map(doc => {
			return ChatInfo.parse({
				id: doc.id, 
				...doc.data()
			})
		})

		// Sort the public chats alphabetically by name.
		chats.sort((a, b) => a.name > b.name ? 1 : -1)

		return chats
	}
})