// homebridge-deconz/lib/VeluxService/Gateway.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { VeluxClient } from 'hb-velux-tools/VeluxClient'

import { VeluxService } from './index.js'

class Gateway extends VeluxService {
  constructor (accessory, params) {
    params.Service = accessory.Services.my.DeconzGateway
    super(accessory, params)
    this.client = accessory.client

    this.addCharacteristicDelegate({
      key: 'heartrate',
      Characteristic: this.Characteristics.my.Heartrate,
      value: 30,
      unit: 's',
      props: { minValue: 0, maxValue: 120, minStep: 1 }
    })

    this.addCharacteristicDelegate({
      key: 'logLevel',
      Characteristic: this.Characteristics.my.LogLevel,
      value: 2,
      props: { minValue: 0, maxValue: 4, minStep: 1 }
    })

    this.addCharacteristicDelegate({
      key: 'restart',
      Characteristic: this.Characteristics.my.Restart,
      value: false
    }).on('didSet', async (value, fromHomeKit) => {
      if (!fromHomeKit || !value) {
        return
      }
      try {
        await this.client.request(VeluxClient.commands.GW_REBOOT_REQ)
        await this.client.disconnect()
      } catch (error) { this.warn(error) }
    })
  }
}

VeluxService.Gateway = Gateway
