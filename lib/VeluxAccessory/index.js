// homebridge-velux/lib/VeluxAccessory/index.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { VeluxClient } from 'hb-velux-tools/VeluxClient'

import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate'
import { VeluxService } from '../VeluxService/index.js'

class VeluxAccessory extends AccessoryDelegate {
  constructor (gateway, params) {
    super(gateway.platform, params)
    this.gateway = gateway
    this.client = gateway.client
    this.log(
      'node %d: %s %s [%s] at %d%%', params.payload.nodeId,
      params.manufacturer, params.model, params.payload.actuatorType,
      100 - params.payload.currentPosition
    )
    this.service = new VeluxService[params.ServiceName](this, params)

    this.on('identify', async () => {
      try {
        this.log(
          'node %d: %s %s [%s] at %d%%', params.payload.nodeId,
          params.manufacturer, params.model, params.payload.actuatorType,
          100 - params.payload.currentPosition
        )
        await this.client.request(VeluxClient.commands.GW_WINK_SEND_REQ, {
          nodeIds: [params.payload.nodeId]
        })
      } catch (error) { this.warn(error) }
    })
  }

  get logLevel () { return this.gateway?.logLevel ?? 2 }

  update (payload) {
    this.service.update(payload)
  }
}

export { VeluxAccessory }
