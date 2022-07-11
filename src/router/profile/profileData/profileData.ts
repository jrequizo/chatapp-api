import * as trpc from '@trpc/server'
import { z } from 'zod'

import { fAdminApp } from '@/utils/gcloud/firebase'

const profilesCollection = fAdminApp.firestore().collection('profiles')

/**
 * Zod schema validators to transform the `firebase/firestore` data.
 */
const ProfileData = z.object({
	uid: z.string(),
	username: z.string(),
	about: z.string(),
	pfp_url: z.string()
})
type ProfileData = z.infer<typeof ProfileData>

/**
 * Route to retrieve the profile data of the user with the given `uid`.
 */
export const router = trpc.router()
.query("profileData", {
	input: z.object({
		uid: z.string(),
	}),
	async resolve({ input }) {
		const data = await profilesCollection.doc(input.uid).get()

		if (data.exists) {
			const profileData = ProfileData.parse(data.data())

			return profileData
		} else {
			throw new trpc.TRPCError({
				message: "User not found.",
				code: "NOT_FOUND"
			})
		}
	}
})