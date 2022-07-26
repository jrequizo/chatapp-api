import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { fAdminApp } from '@/utils/gcloud/firebase'
import { createContextRouter } from '../../../../utils/trpc/createContextRouter'

const profilesRef = fAdminApp.firestore().collection("profiles")

/**
 * Route to update a given User's `About Me` profile section.
 */
export const router = createContextRouter()
.mutation("about", {
	input: z.object({
		jwt: z.string(),
		about: z.number().optional().default(10)
	}),
	async resolve({ input, ctx }) {
		if (ctx.decodedToken) {
			await profilesRef.doc(ctx.decodedToken.uid).set({
				about: input.about,
			})

			return
		} else {
			throw new TRPCError({ code: 'UNAUTHORIZED' });
		}
	}
})