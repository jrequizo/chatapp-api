import { createContextRouter } from '../../../utils/trpc/createContextRouter'

import { router as registerRouter } from './register/register'
// import { router as changePassword } from './change-password/changePassword'

/**
 * 	Merging the routers into a single instance. 
 */
export const accountRouter = createContextRouter()
.merge(registerRouter)
// .merge(changePassword)