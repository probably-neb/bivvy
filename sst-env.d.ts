/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    "DB_TOKEN": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "DB_URL": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GOOGLE_CLIENT_ID": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GOOGLE_CLIENT_ID_SECRET": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "REPLICACHE_LICENSE_KEY": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Site": {
      "type": "sst.aws.StaticSite"
      "url": string
    }
    "auth": {
      "publicKey": string
      "type": "sst.aws.Auth"
    }
  }
}
export {}
