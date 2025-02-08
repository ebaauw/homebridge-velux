// homebridge-velux/lib/VeluxAccessory/WindowCovering.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { VeluxAccessory } from './index.js'
import '../VeluxService/WindowCovering.js'

class WindowCovering extends VeluxAccessory {
  constructor (gateway, params = {}) {
    params.ServiceName = 'WindowCovering'
    super(gateway, params)

    setImmediate(() => {
      this.emit('initialised')
    })
  }
}

VeluxAccessory.WindowCovering = WindowCovering
