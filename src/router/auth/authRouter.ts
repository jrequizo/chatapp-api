import { createContextRouter } from '../../utils/trpc/createContextRouter'

import { router as loginRouter } from "./login/login"
import { router as logoutRouter } from "./logout/logout"
import { router as reauthRouter } from "./reauth/reauth"

/**
 * 	Merging the routers into a single instance. 
 */
export const authRouter = createContextRouter()
.merge(loginRouter)
.merge(logoutRouter)
.merge(reauthRouter)