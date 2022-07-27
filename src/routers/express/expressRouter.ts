import express from 'express'

import profileRouter from './profile/router'

const expressRouter = express.Router()

expressRouter.use('/profile', profileRouter)

export {
	expressRouter
};