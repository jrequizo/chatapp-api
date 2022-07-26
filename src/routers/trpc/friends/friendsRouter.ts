import { createContextRouter } from '../../../utils/trpc/createContextRouter'

import { router as chatHistory } from './chat-history/chatHistory'

/**
 * 	Merging the routers into a single instance. 
 */
export const friendsRouter = createContextRouter()
.merge(chatHistory)