import { withRoleAuth } from './withRoleAuth'

export const withHostAuth = (handler: any) => withRoleAuth('host', handler)