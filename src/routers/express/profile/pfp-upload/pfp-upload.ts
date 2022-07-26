import { Request, Response } from 'express'

import { getStorage } from "firebase-admin/storage";

import crypto from 'crypto'

import { fAdminApp } from '@/utils/gcloud/firebase';

const profilesRef = fAdminApp.firestore().collection("profiles")

const storage = getStorage()
const bucket = storage.bucket('chatapp-profile');
// bucket.acl.add({
// 	entity: 'allUsers',
// 	role: bucket.acl
// })

export const handler = async (req: Request, res: Response) => {
	// Validate the request body jwt
	const token = req.headers.authorization?.split(" ")[1]

	if (!token) {
		return res.status(401).end()
	}

	// Convert file from Multer.File
	const buffer = req.file?.buffer

	if (!buffer || buffer.byteLength === 0) {
		return res.status(400).end()
	}

	// Verify jwt
	const decodedJwt = await fAdminApp.auth().verifyIdToken(token);

	const uid = decodedJwt.uid;

	// generate url for cdn
	const url = crypto.createHash('md5').update(uid.toString()).digest('hex')

	// Create file in bucket
	const file = bucket.file(`pfp/${url}.png`)

	// Upload file
	await file.save(buffer)

	await file.makePublic()

	const bucketUrl = file.publicUrl()

	// Update entry in Firestore
	await profilesRef.doc(uid).set(
		{
			pfp_url: bucketUrl
		},
		{
			merge: true
		}
	)

	return res.status(201).end()
}