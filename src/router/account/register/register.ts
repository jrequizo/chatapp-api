import * as trpc from "@trpc/server"
import { z } from 'zod'

import { getAuth, createUserWithEmailAndPassword, User } from "firebase/auth"
import { fClientApp, fAdminApp } from "@/utils/gcloud/firebase"

// import { pubSubClient } from "@/utils/gcloud/pubsub"

import event from "@/utils/event/event"

const fClientAuth = getAuth(fClientApp)

const accountsRef = fAdminApp.firestore().collection("accounts")

/**
 * 	Helper function to validate whether a given `username` is in use in `firebase`
 * 	@param username The username of the registering User.
 * 	@returns A boolean indicating if the username is in use.
 */
async function usernameTaken(username: string) {
	const usernameQuery = await accountsRef.where("username", "==", username).get()

	return !usernameQuery.empty
}

/**
 * 	Helper function to validate whether a given `email` is in use in `firebase`
 * @param email The email of the registering User.
 * @returns A boolean indicating if the email is in use.
 */
async function emailTaken(email: string) {
	try {
		await fAdminApp.auth().getUserByEmail(email)
		return true
	} catch (exception) {
		return false
	}
}

/**
 * 	Helper function to manage the account creation process. Does the following in order:
 * 	- Registers the `email` & `password` with `firebase/auth`
 * 	- Creates an entry in the `accounts` collection containing `username` field with the documentId as the `uid`.
 * 	- Pushes a message with the `username` & `uid` to the Topic `profile-created` on Google PubSub
 * 	@param email 
 * 	@param username 
 * 	@param password 
 * 	@returns An object containing the `jwt`, `refreshToken`, and stringified {@link User} object.
 */
async function createAccount(email: string, username: string, password: string) {
	// Register the account with `firebase/auth`
	const userCredentials = await createUserWithEmailAndPassword(fClientAuth, email, password)

	// Add a reference to `account` collection in `firebase/firestore`
	await accountsRef.doc(userCredentials.user.uid).set({
		username: username
	})

	const json = {uid: userCredentials.user.uid, username: username}
	
	// Temporary in-app event-driven communication.
	event.emit('profile-created', json)
	
	/**
	 * Pubsub Topic that is messaged when a new User is created.
	 * Relevant API's create a subscription to this topic and perform actions when notified.
	 */
	// const topic = pubSubClient.topic('profile-created')

	// Push a new message to Google PubSub `profile-create` Topic.
	// await topic.publishMessage({json})

	// User jwt
	const token = await userCredentials.user.getIdToken()

	return {
		user: userCredentials.user,
		jwt: token,
		refreshToken: userCredentials.user.refreshToken
	}
}

/**
 * 	Regex that validates at least one of each exists:
 * 		- Lowercase
 * 		- Uppercase
 * 		- Number
 */
const passwordRegex = RegExp('(?=.*[a-z].*)(?=.*[A-Z].*)(.*\\d.*)')

/**
 * 	Route to create a new User from an `email`, `username`, and `password.
 */
export const router = trpc.router()
.mutation("register", {
	input: z.object({
		email: z.string().email(),
		username: z.string(),
		password: z.string({
			invalid_type_error: "Password must contain a lowercase, uppercase, and a number. Password must be between 8 and 100 characters long."
		}).min(8).max(100).regex(passwordRegex) 
	}),
	async resolve({ input }) {
		// Validate the provided `username` and `email` are not in use.
		const [_usernameTaken, _emailTaken] = await Promise.all([usernameTaken(input.username), emailTaken(input.email)])

		if (!_usernameTaken && !_emailTaken) {
			return await createAccount(input.email, input.username, input.password);
		} else {
			// If the username and email are taken, reject the request.
			const emailError = _emailTaken ? "{email} " : ""
			const usernameError = _usernameTaken ? "{username}" : ""

			throw new trpc.TRPCError({
				message: `Credentials in use: ${emailError}${usernameError}`,
				code: "CONFLICT"
			})
		}
	}
})