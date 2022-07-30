import * as trpc from "@trpc/server"
import { TRPCError } from "@trpc/server"
import { z } from 'zod'

import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { fClientApp } from "@/utils/gcloud/firebase"
import { FirebaseError } from "firebase/app"

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
			const { email: _email, password: _password } = input;
			const email = _email.trim();
			const password = _password.trim();

			try {
				let userCredentials = await signInWithEmailAndPassword(auth, email, password)

				let jwt = await userCredentials.user.getIdToken()
				let refreshToken = userCredentials.user.refreshToken
				let uid = userCredentials.user.uid

				return {
					jwt: jwt,
					refreshToken: refreshToken,
					user: JSON.stringify(userCredentials.user),
					uid: uid
				}
			} catch (error) {
				if (error instanceof FirebaseError) {
					switch (error.code) {
						case "auth/invalid-email":
							throw new TRPCError({
								message: error.code,
								code: "BAD_REQUEST"
							})
						case "auth/wrong-password":
							throw new TRPCError({
								message: error.code,
								code: "UNAUTHORIZED"
							})
						case "auth/user-not-found":
							throw new TRPCError({
								message: error.code,
								code: "NOT_FOUND"
							})
					}
				}
			}

		},
	})