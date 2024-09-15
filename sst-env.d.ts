/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    "AuthRouter": {
      "type": "sst.aws.Router"
      "url": string
    }
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
    "api": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "auth": {
      "publicKey": string
      "type": "sst.aws.Auth"
    }
    "authAuthenticator": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "clientTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
  }
}
export {}
