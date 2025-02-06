// homebridge-velux/lib/VeluxAccessory/index.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate'
import { VeluxService } from '../VeluxService/index.js'

class VeluxAccessory extends AccessoryDelegate {
  constructor (gateway, params) {
    super(gateway.platform, params)
    this.gateway = gateway
    this.client = gateway.client
    this.log(
      '%s [%d]: %s %s [%s] at %d%%', params.name, params.payload.nodeId,
      params.manufacturer, params.model, params.payload.actuatorType,
      100 - params.payload.currentPosition
    )
    this.service = new VeluxService[params.ServiceName](this, params)
  }

  get logLevel () { return this.gateway?.logLevel ?? 2 }

  update (payload) {
    this.service.update(payload)
  }
}

export { VeluxAccessory }
