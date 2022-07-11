import { createContextRouter } from '../../utils/trpc/createContextRouter'

import { router as aboutRouter } from './about/about'
import { router as profileDataRouter } from './profileData/profileData'

/**
 * 	Merging the routers into a single instance. 
 */
export const profileRouter = createContextRouter()
.merge(aboutRouter)
.merge(profileDataRouter)