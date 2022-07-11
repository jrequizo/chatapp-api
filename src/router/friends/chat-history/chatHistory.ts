import * as trpc from "@trpc/server"
import { z } from 'zod'

import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { fClientApp } from "@/utils/gcloud/firebase"

const auth = getAuth(fClientApp)

export const router = trpc.router()
.query("chatHistory", {
	input: z.object({
		chatId: z.string(),
		length: z.number().optional().default(10)
	}),
	async resolve({ input }) {
		return {
		}
	}
})