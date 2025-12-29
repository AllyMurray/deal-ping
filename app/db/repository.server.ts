// Re-export repository functions for server-side use in React Router
export {
  // Channel functions
  getChannelsByUser,
  getAllChannels,
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  // Config functions
  getConfigsByUser,
  getAllConfigs,
  getEnabledConfigs,
  getConfigsByChannel,
  getConfig,
  getConfigBySearchTerm,
  getAllConfigsForSearchTerm,
  findDuplicateSearchTerms,
  upsertConfig,
  deleteConfig,
  deleteConfigsByChannel,
  // Deal functions
  dealExists,
  getDeal,
  createDeal,
  // AllowedUser functions
  isUserAllowed,
  isUserAdmin,
  getAllowedUser,
  getAllowedUsers,
  addAllowedUser,
  updateAllowedUserAdmin,
  updateAllowedUserProfile,
  updateUserSettings,
  removeAllowedUser,
  seedAdminUser,
  // Grouped helpers
  getEnabledConfigsGroupedByChannel,
} from "../../src/db/repository";

// Re-export types
export type {
  Channel,
  SearchTermConfig,
  Deal,
  AllowedUser,
} from "../../src/db/schemas";

export type { DuplicateSearchTermInfo } from "../../src/db/repository";
