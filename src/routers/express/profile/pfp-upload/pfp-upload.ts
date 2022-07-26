import { Request, Response } from 'express'

import { getStorage } from "firebase-admin/storage";

import crypto from 'crypto'

import sharp from 'sharp'

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
	const fileLarge = bucket.file(`pfp/${url}-large.png`)
	const fileSmall = bucket.file(`pfp/${url}-small.png`)

	const [largeResized, smallResized] = await Promise.resolve([
		await sharp(buffer).resize({
			width: 2526,
			height: 256,
			fit: 'inside'
		}).toBuffer(),
		await sharp(buffer).resize({
			width: 48,
			height: 48,
			fit: 'inside'
		}).toBuffer()
	])

	// Upload file
	await Promise.resolve([
		await fileLarge.save(largeResized),
		await fileSmall.save(smallResized),
	])

	let bucketUrl = fileLarge.publicUrl();
	bucketUrl = bucketUrl.slice(0, bucketUrl.length - 10);

	await Promise.resolve([
		await fileLarge.makePublic(),
		await fileSmall.makePublic(),

		// Update entry in Firestore
		await profilesRef.doc(uid).set(
			{
				pfp_url: bucketUrl
			},
			{
				merge: true
			}
		)
	])


	return res.status(201).end()
}