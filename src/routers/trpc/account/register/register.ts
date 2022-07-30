import * as trpc from "@trpc/server"
import { TRPCError } from "@trpc/server"
import { z } from 'zod'

import { getAuth, createUserWithEmailAndPassword, User } from "firebase/auth"
import { fClientApp, fAdminApp } from "@/utils/gcloud/firebase"

// import { pubSubClient } from "@/utils/gcloud/pubsub"

import event from "@/utils/event/event"
import { FirebaseError } from "firebase/app"

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

	const json = { uid: userCredentials.user.uid, username: username }

	// Temporary in-app event-driven communication.
	event.emit('profile-created', json)

	/**
	 * Pubsub Topic that is messaged when a new User is created.
	 * Relevant API's create a subscription to this topic and perform actions when notified.
	 */
	// const topic = pubSubClient.topic('profile-created')

	// Push a new message to Google PubSub `profile-create` Topic.
	// await topic.publishMessage({json})

	/**
	 * User credentials.
	 * This should always return the same shape as the `login` route.
	 */ 
	let jwt = await userCredentials.user.getIdToken()
	let refreshToken = userCredentials.user.refreshToken
	let uid = userCredentials.user.uid

	return {
		jwt: jwt,
		refreshToken: refreshToken,
		user: JSON.stringify(userCredentials.user),
		uid: uid
	}
}

/**
 * 	Regex that validates at least one of each exists:
 * 		- Lowercase
 * 		- Uppercase
 * 		- Number
 */
// const passwordRegex = RegExp('(?=.*[a-z].*)(?=.*[A-Z].*)(.*\\d.*)')

const lowercaseRegex = /(.*[a-z].*)/
const uppercaseRegex = /(.*[A-Z].*)/
const numberRegex = /(.*\d.*)/

/**
 * 	Route to create a new User from an `email`, `username`, and `password.
 */
export const router = trpc.router()
	.mutation("register", {
		input: z.object({
			email: z.string().email(),
			username: z.string()
			.min(4, "Username must be 4 or more characters long.")
			.max(24, "Username must be 24 or less characters long."),
			password: z.string()
			.min(8, "Password must be longer than 8 characters long.")
			.max(100, "Password must be shorter than 100 characters long.")
			.regex(lowercaseRegex, "Password must contain a lowercase letter.")
			.regex(uppercaseRegex, "Password must contain an uppercase letter.")
			.regex(numberRegex, "Password must contain a number.")
		}),
		async resolve({ input }) {
			const { username: _username, email: _email, password: _password } = input;
			const username = _username.trim();
			const email = _email.trim();
			const password = _password.trim();

			// Validate the provided `username` and `email` are not in use.
			const [isUsernameTaken, isEmailTaken] = await Promise.all([usernameTaken(username), emailTaken(email)])

			if (!isUsernameTaken && !isEmailTaken) {
				try {
					return await createAccount(email, username, password);
				} catch (error) {
					if (error instanceof FirebaseError) {
						switch (error.code) {
							case "auth/invalid-email":
								throw new TRPCError({
									message: error.code,
									code: "BAD_REQUEST"
								});
							case "auth/email-already-exists":
								throw new TRPCError({
									message: error.code,
									code: "CONFLICT"
								});
						}
					}
				}
			} else {
				const errors = []
				if (isUsernameTaken) errors.push("Username already in use.")
				if (isEmailTaken) errors.push("Email already in use.")

				throw new trpc.TRPCError({
					message: JSON.stringify(errors),
					code: "CONFLICT",
				})
			}
		}
	})