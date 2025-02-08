// homebridge-velux/lib/VeluxAccessory/WindowCovering.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { VeluxClient } from 'hb-velux-tools/VeluxClient'

import { VeluxAccessory } from './index.js'
import '../VeluxService/WindowCovering.js'

class WindowCovering extends VeluxAccessory {
  constructor (gateway, params = {}) {
    params.ServiceName = 'WindowCovering'
    super(gateway, params)
    this.nodeId = params.payload.nodeId

    setImmediate(() => {
      this.emit('initialised')
    })
  }

  async identify () {
    try {
      await this.client.request(VeluxClient.commands.GW_WINK_REQ, {
        nodeIds: [this.nodeId]
      })
    } catch (error) { this.warn(error) }
  }
}

VeluxAccessory.WindowCovering = WindowCovering
