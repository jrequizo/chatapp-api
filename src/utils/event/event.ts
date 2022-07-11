import { EventEmitter } from "node:events";

import { onProfileCreatedEvent } from "@/topics/profile-created";

/**
 * Temporary Event bus for in-app route communication.
 * In-app communication is handled through event-driven architecture.
 */
const event = new EventEmitter()

/**
 * Bind any callbacks for the event-emitter here.
 */
event.on('profile-created', onProfileCreatedEvent)

/**
 * Export
 */
export default event;