import deasync from "deasync";

import { initializeApp } from "firebase/app";

import fAdminApp from "firebase-admin"

import secretManager from "./secret_manager";

/**
 * 	Initialize the Firebase Client.
 * 	The Firebase Client is mainly used for the Firebase Auth library for handling user authentication.
 */
const fClientApp = initializeApp({
	"apiKey": process.env.FIREBASE_WEB_API_KEY,
	"authDomain": process.env.FIREBASE_AUTH_DOMAIN,
	"projectId": process.env.FIREBASE_PROJECT_ID,
	"storageBucket": process.env.FIREBASE_STORAGE_BUCKET,
	"messagingSenderId": process.env.FIREBASE_MESSAGING_SENDER_ID,
	"appId": process.env.FIREBASE_APP_ID,
	"measurementId": process.env.FIREBASE_MEASUREMENT_ID,
	"databaseURL": process.env.FIREBASE_DATABASE_URL
});

// Secret name for use with GCP Secret Manager.
const firebaseAdminSdkSecretName = process.env.GCLOUD_SECRET_FIREBASE_ADMIN_SDK || ""

/**
 * 	Initializes the Firebase Admin SDK.
 * 	Retrieves the credential file from GCP Secret Manager and initializes 
 */
async function _initFirebase() {
	try {
		const secretString = await secretManager.getSecret(firebaseAdminSdkSecretName)

		if (secretString) {
			const secret = JSON.parse(secretString)
			
			fAdminApp.initializeApp({
				credential: fAdminApp.credential.cert({
					...secret
				}),
				databaseURL: process.env.FIREBASE_DATABASE_URL
			})
		} else {
			throw new ReferenceError("secretString is undefined")
		}
	} catch ({ message }) {
		console.log(`Error when initializing Firebase config: ${message}`)
	}
}

/**
 * 	Helper function to synchronously run initialization function.
 */
const initFirebase = deasync((_: any) => {
	_initFirebase().then(() => {
		// Release control back to main event loop
		_()
	})
})

export {
	/**
	 * 	Initializes the Firebase Admin SDK.
	 * 	Retrieves the credential file from GCP Secret Manager and initializes 
	 */
	initFirebase,
	/**
	 * 	Firebase Admin SDK client application to access Firebase platform with 
	 * 	elevated privileges. 
	 */
	fAdminApp,
	/**
	 * 	Firebase Client application to access Firebase platform from a User
	 * 	context. 
	 * 	
	 * 	Use only for `@firebase/auth`, otherwise see {@link fAdminApp}
	 */
	fClientApp
}