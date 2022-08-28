import { Types, Constants } from '@maxqwars/metaform'

const baseUrl = "api.anilibria.tv"
const timeout = 6000

const sharedConfig: Types.MetaModuleOptions = {
  timeout,
  baseUrl,
  useHttps: true,
  version: Constants.API_VERSION.V2
}

export default sharedConfig