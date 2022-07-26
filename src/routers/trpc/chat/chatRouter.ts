import { createContextRouter } from '../../../utils/trpc/createContextRouter'

import { router as chatHistory } from './chat-history/chatHistory'
import { router as publicChats } from './public-chats/publicChats'

/**
 * 	Merging the routers into a single instance. 
 */
export const chatRouter = createContextRouter()
.merge(chatHistory)
.merge(publicChats)