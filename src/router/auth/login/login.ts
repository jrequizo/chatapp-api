import * as trpc from "@trpc/server"
import { z } from 'zod'

import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { fClientApp } from "@/utils/gcloud/firebase"

const auth = getAuth(fClientApp)

/**
 * 	Route to generate a User jwt from an `email` and `password`.
 * 	Uses Firebase's Auth client.
 */
export const router = trpc.router()
.mutation("login", {
	input: z.object({
		email: z.string(),
		password: z.string()
	}),
	async resolve({ input }) {
		let userCredentials = await signInWithEmailAndPassword(auth, input.email, input.password)

		let jwt = await userCredentials.user.getIdToken()
		let refreshToken = userCredentials.user.refreshToken
		let uid = userCredentials.user.uid

		return {
			jwt: jwt,
			refreshToken: refreshToken,
			user: JSON.stringify(userCredentials.user),
			uid: uid
		}
	},
})