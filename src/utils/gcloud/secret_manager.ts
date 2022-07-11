import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient()
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.LOCAL_GOOGLE_CLOUD_PROJECT

/**
 * 
 * @param secretName The name of the secret stored in GCP Secret Manager.
 * @returns {Promise} The promise which resolves to either
 * - `string` secret stored in GCP Secret Manager
 * - `undefined` if the provided {@link secretName} doesn't exist or the Service Account does not have the `Secret Accessor` role.
 */
async function getSecret(secretName: string) {
	try {
		if (projectId) {
			const [response, request, _] = await client.accessSecretVersion({ name: client.secretVersionPath(projectId, secretName, "latest")})
	
			if (response.payload) {
				if (response.payload.data) {
					return response.payload.data.toString()
				}
			}
		} else {
			throw new ReferenceError("projectId is undefined")
		}
	} catch ({ errorMessage })  {
		console.log(`SecretManager: ${errorMessage}`)
	}

	return undefined
}

export default {
	getSecret
}