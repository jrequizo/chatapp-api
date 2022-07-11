import deasync from "deasync";

import { PubSub } from '@google-cloud/pubsub'

import { onProfileCreated } from "@/topics/profile-created";

const pubSubClient = new PubSub({projectId: process.env.PUBSUB_PROJECT_ID})

async function initProfileTopic() {
	try {
		await pubSubClient.createTopic('profile-create')
	} catch (error) { }
}

async function initProfileCreateSubscription() {
	try {
		const tProfileCreate = pubSubClient.topic('profile-create')
		await tProfileCreate.createSubscription('profile-create-subscription')
	} catch (error) { }
}

async function initOnProfileCreatedCallback() {
	try {
		const tProfileCreate = pubSubClient.topic('profile-created')
		const tProfileCreateSubscription = tProfileCreate.subscription('profile-create-subscription')
		
		tProfileCreateSubscription.on('message', onProfileCreated)
	} catch (error) {
		// console.log(error)
	}
}

/**
 * Initialization of PubSub components (Topics, Subscriptions).
 * Assigns handlers when a Message is pushed to a Topic that this API is subscribed to.
 */
async function _initPubsub() {
	initProfileTopic()
	initProfileCreateSubscription()
	initOnProfileCreatedCallback()
}

/**
 * Helper function to synchronously run initialization function.
 */
const initPubsub = deasync((_: any) => {
	_initPubsub().then(() => {
		// Release control back to main event loop
		_()
	})
})

export {
	/**
	 * Initialization of PubSub components (Topics, Subscriptions).
	 * Assigns handlers when a Message is pushed to a Topic that this API is subscribed to.
	 */
	initPubsub,
	pubSubClient
}