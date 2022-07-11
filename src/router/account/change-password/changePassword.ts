import * as trpc from "@trpc/server"
import { z } from 'zod'


export const router = trpc.router()
.query("changePassword", {
	input: z.object({
	}),
	async resolve({ input }) {
		
		return {
		}
	}
})