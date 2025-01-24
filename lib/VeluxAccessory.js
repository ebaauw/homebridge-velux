// homebridge-velux/lib/VeluxAccessory.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate'

import { VeluxService } from './VeluxService.js'

class WindowCovering extends AccessoryDelegate {
  constructor (gateway, params = {}) {
    super(gateway.platform, params)
    this.gateway = gateway
    this.client = gateway.client
    this.log(
      '%s [%d]: %s %s [%s] at %d%%', params.name, params.payload.nodeId,
      params.manufacturer, params.model, params.payload.actuatorType,
      params.payload.currentPosition
    )
    this.service = new VeluxService.WindowCovering(this, params)
    this.manageLogLevel(this.service.characteristicDelegate('logLevel'))

    setImmediate(() => {
      this.emit('initialised')
    })
  }

  update (payload) {
    this.service.update(payload)
  }
}

class VeluxAccessory {
  static get WindowCovering () { return WindowCovering }
}

export { VeluxAccessory }
