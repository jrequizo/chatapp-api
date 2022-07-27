import express from 'express'
import cors from 'cors'

import path from 'path'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

import * as trpcExpress from '@trpc/server/adapters/express'

/**
 * Environment variable initialization.
 * Reads from the .env file and applies any relevant transformations of references.
 * These have to run first and foremost to properly initialize the `process.env` variables.
 */
const env = dotenv.config({path: path.resolve(process.cwd(),`.env.${process.env.NODE_ENV}`)})
dotenvExpand.expand(env)


/**
 * Firebase Initialization.
 */
import { initFirebase } from '@/utils/gcloud/firebase'
initFirebase()
/**
 * Pubsub Initialization.
 * Temporarily unused while API is single-app. Use `@utils\event\event` as the event bus instead.
 */
// import { initPubsub } from '@/utils/gcloud/pubsub'
// initPubsub()

/**
 * These imports have to be made after the Firebase/PubSub initialization as
 * they rely on the Firebase clients and/or PubSub Topics/Subscriptions.
 */
import { createContext, createContextRouter } from './utils/trpc/createContextRouter'
import { trpcRouter } from './routers/trpc/trpcRouter'
import expressRouter from './routers/express/expressRouter'

/**
 * 	Express and tRPC Setup.
 * 	Enables Cross-Origin Resource Sharing to allow access from the client application.
 */
const PORT = process.env.PORT || 3001

const appRouter = createContextRouter().merge(trpcRouter)
const app = express()
app.use(cors())

app.use(
	"/trpc",
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext: createContext,
	})
)

app.use("/api", expressRouter)

const server = app.listen(PORT, () => {
	console.log(`tRPC API: Server listening on port ${PORT}`)
});

/**
 * Automatically shut down the server if we are running a build test fire after the server has instantiated.
 * TODO: Run some health checks on an endpoint to make sure ports are exposed properly?
 * TODO: Run unit tests on the functions in /router
 */
server.on('listening', () => {
	if (process.env.NODE_ENV === "buildtest") {
		server.close(() => {
			console.log(`Process ran successfully`)
			process.exit(0);
		})
	}
})

/**
 * 	Expose the API interface to the Client application for intellisense and strong typing.
 */
export type AppRouter = typeof appRouter