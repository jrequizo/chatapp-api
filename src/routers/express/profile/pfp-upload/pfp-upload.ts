import { Request, Response } from 'express'

import { getStorage } from "firebase-admin/storage";

import crypto from 'crypto'

import sharp from 'sharp'

import { fAdminApp } from '@/utils/gcloud/firebase';

const profilesRef = fAdminApp.firestore().collection("profiles");

const storage = getStorage();
const bucket = storage.bucket('chatapp-profile');

export const handler = async (req: Request, res: Response) => {
	// Validate the request body jwt
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).end();
	}

	if (!req.file) {
		return res.status(400).end();
	}

	// Convert file from Multer.File
	const buffer = req.file?.buffer;

	if (!buffer || buffer.byteLength === 0) {
		return res.status(400).end();
	}

	// Verify User's authorization to change their profile picture
	let decodedJwt = null;
	try {
		decodedJwt = await fAdminApp.auth().verifyIdToken(token);
	} catch (error) {
		return res.status(401).end();
	}
	const uid = decodedJwt.uid;

	// generate url for cdn
	const url = crypto.createHash('md5').update(uid.toString()).digest('hex');

	bucket.getFiles
	// Create file in bucket
	const fileLarge = bucket.file(`pfp/${url}-large.png`);
	const fileSmall = bucket.file(`pfp/${url}-small.png`);

	const [largeResized, smallResized] = await Promise.all([
		// Resize the files
		sharp(buffer).resize({
			width: 2526,
			height: 256,
			fit: 'inside'
		}).toBuffer(),
		sharp(buffer).resize({
			width: 48,
			height: 48,
			fit: 'inside'
		}).toBuffer()
	])

	let bucketUrl = fileLarge.publicUrl();
	bucketUrl = bucketUrl.slice(0, bucketUrl.length - 10);

	// Upload file
	await Promise.all([
		// Save the images to the bucket
		fileLarge.save(largeResized),
		fileSmall.save(smallResized),

		// Update entry in Firestore
		profilesRef.doc(uid).set({
			pfp_url: bucketUrl
		}, {
			merge: true
		})
	]);

	// Upload file
	await Promise.all([
		fileLarge.makePublic(),
		fileSmall.makePublic(),
	]);

	return res.status(201).end();
}