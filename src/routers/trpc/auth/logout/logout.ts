import * as trpc from "@trpc/server"
import { z } from 'zod'

import { fAdminApp } from "@/utils/gcloud/firebase"

const auth = fAdminApp.auth()

/**
 * 	TODO: properly implement this route.
 * 			- Currently, auth.revokeRefreshToken takes a User's uid. Exposing this would only allow any User to un-authenticate any other User.
 * 			- Maybe pass in a User's jwt and validate if it is still valid and pull the uid from that?
 * 
 * 			- Look into proper way to revoke jwt's rather than revoking all refreshTokens.
 * 
 * 	Route to invalidate all refreshToken's of a given User.
 */
export const router = trpc.router()
.query("logout", {
	input: z.object({
		refreshToken: z.string()
	}),
	async resolve({ input }) {
		await auth.revokeRefreshTokens(input.refreshToken)

		return true
	}
})