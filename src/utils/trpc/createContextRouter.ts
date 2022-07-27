import * as trpc from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next';
import { fAdminApp } from '@/utils/gcloud/firebase';

export async function createContext({
	req,
	res,
}: trpcNext.CreateNextContextOptions) {
	// Create context based on the request object
	// Will be available as `ctx` in all your resolvers
	async function getJwtFromHeader() {
		if (req.headers.authorization) {
			try {
				const token = req.headers.authorization.split(' ')[1]
				const decodedToken = await fAdminApp.auth().verifyIdToken(token)
				return decodedToken;
			} catch (error) {
				return null;
			}
		}
		return null;
	}

	const decodedToken = await getJwtFromHeader();

	return {
		decodedToken,
	};
}
type Context = trpc.inferAsyncReturnType<typeof createContext>;

/**
 * Creates a `trpc.router` that validates and returns the token provided in an `authorization` header.
 * @returns `trpc.router` with an authorization context.
 */
export function createContextRouter(){
	return trpc.router<Context>();
}