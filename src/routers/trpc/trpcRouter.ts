import { createContextRouter } from "../../utils/trpc/createContextRouter"

import { accountRouter } from './account/accountRouter'
import { authRouter } from './auth/authRouter'
import { chatRouter } from './chat/chatRouter'
import { friendsRouter } from './friends/friendsRouter'
import { notificationsRouter } from './notifications/notificationsRouter'
import { profileRouter } from './profile/profileRouter'
import { userSearchRouter } from './user-search/userSearchRouter'

/**
 * 	Merging the routers into a single instance. 
 */
export const trpcRouter = createContextRouter()
.merge('account.', accountRouter)
.merge('auth.', authRouter)
.merge('chat.', chatRouter)
.merge('friends.', friendsRouter)
.merge('notifications.', notificationsRouter)
.merge('profile.', profileRouter)
.merge('user-search.', userSearchRouter)