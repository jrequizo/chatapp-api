import * as trpc from "@trpc/server"
import { z } from 'zod'

/**
 * Helper function to make a HTTP request to the Firebase REST API (firebase-admin/auth).
 * @param refreshToken The refresh token of a User to exchange for a new `jwt`.
 * @throws `TRPCError` when provided an invalid `refreshToken`.
 * @returns A new `jwt`.
 */
async function exchangeRefreshToken(refreshToken: string) {
	const response = await fetch(
		`https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_WEB_API_KEY}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"	
			},
			body: JSON.stringify({
				grant_type: "refresh_token",
				refresh_token: refreshToken
			})
		},
	)

	if (response.status !== 200) {
		throw new trpc.TRPCError({
			message: "Invalid JWT or missing API key.",
			code: "FORBIDDEN"
		})
	}

	const result = await response.json()

	return result
}

/**
 * 	Route to exchange a refreshToken for a fresh jwt.
 * 	Used when the User's jwt expires and requires a fresh jwt.
 */
export const router = trpc.router()
.mutation("reauth", {
	input: z.object({
		refreshToken: z.string()
	}),
	async resolve({ input }) {
		let userCredentials = await exchangeRefreshToken(input.refreshToken)

		return {
			jwt: userCredentials.id_token,
			refreshToken: userCredentials.refresh_token
		}
	}
})