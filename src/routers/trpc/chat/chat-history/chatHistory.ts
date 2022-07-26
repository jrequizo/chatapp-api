import * as trpc from "@trpc/server"
import { z } from 'zod'

import { fAdminApp } from "@/utils/gcloud/firebase"

const db = fAdminApp.database()

/**
 * Zod schema validators to transform the `firebase/database` data.
 */
const MessageData = z.object({
	content: z.string() ,
	sender: z.object({
		pfp_url: z.string(),
		uid: z.string(),
		username: z.string()
	}),
	timestamp: z.number(),
	chatId: z.string()
})

type MessageData = z.infer<typeof MessageData>

/**
 * Route to retrieve the last `n` messages from the chat with specified `chatId`.
 */
export const router = trpc.router()
.query("chatHistory", {
	input: z.object({
		chatId: z.string(),
		length: z.number().optional().default(20)
	}),
	async resolve({ input }) {
		// TODO: validate if the provided `chatId` is valid. If not, throw an error.
		const ref = db.ref(input.chatId).child('messages')

		// Retrieve messages from `firebase/database`.
		const response = await ref.orderByChild('timestamp').limitToLast(input.length).get()

		const messages : Array<MessageData> = []

		// Map the objects to an Array
		response.forEach((messageData) => {
			messages.push(MessageData.parse({
				...messageData.toJSON(),
				"chatId": input.chatId
			}))
		})

		// Sort the messages to put the newest messages at the start of the array and oldest at the end.
		messages.sort((a, b) => new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1)

		return messages
	}
})