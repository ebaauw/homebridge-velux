// homebridge-deconz/lib/VeluxService/WindowCovering.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { timeout } from 'hb-lib-tools'

import { VeluxClient } from 'hb-velux-tools/VeluxClient'

import { VeluxService } from '../VeluxService/index.js'

class WindowCovering extends VeluxService {
  constructor (accessory, params) {
    params.Service = accessory.Services.hap.WindowCovering
    super(accessory, params)
    this.client = accessory.client

    this.addCharacteristicDelegate({
      key: 'currentPosition',
      Characteristic: this.Characteristics.hap.CurrentPosition,
      unit: '%'
    })

    this.addCharacteristicDelegate({
      key: 'targetPosition',
      Characteristic: this.Characteristics.hap.TargetPosition,
      unit: '%'
    }).on('didSet', async (value, fromHomeKit) => {
      if (!fromHomeKit) {
        return
      }
      const position = 100 - value
      try {
        await this.client.request(VeluxClient.commands.GW_COMMAND_SEND_REQ, {
          position,
          nodeIds: [params.payload.nodeId]
        })
      } catch (error) { this.warn(error) }
    })

    this.addCharacteristicDelegate({
      key: 'positionState',
      Characteristic: this.Characteristics.hap.PositionState
    })

    this.addCharacteristicDelegate({
      key: 'holdPosition',
      Characteristic: this.Characteristics.hap.HoldPosition
    }).on('didSet', async () => {
      try {
        await this.client.request(VeluxClient.commands.GW_COMMAND_SEND_REQ, {
          position: 'current',
          nodeIds: [params.payload.nodeId]
        })
      } catch (error) { this.warn(error) }
      this.log('stop')
    })

    this.addCharacteristicDelegate({
      key: 'motorSpeed',
      Characteristic: this.Characteristics.my.MotorSpeed,
      unit: '',
      props: {
        unit: '',
        minValue: 0,
        maxValue: 2,
        minStep: 1
      }
    }).on('didSet', async (value, fromHomeKit) => {
      if (!fromHomeKit) {
        return
      }
      const speed = ['default', 'slow', 'fast'](value)
      this.log('set speed to %s', speed)
    })

    this.addCharacteristicDelegate({
      key: 'positionChange',
      Characteristic: this.Characteristics.my.PositionChange
    }).on('didSet', async (value) => {
      if (value !== 0) {
        this.log('change position by %s', value)
        await timeout(this.platform.config.waitTimeReset)
        this.values.positionChange = 0
      }
    })
    this.values.positionChange = 0

    this.update(params.payload)
  }

  update (payload) {
    this.debug('event: %j', payload)
    if (!isNaN(parseInt(payload.currentPosition))) {
      this.values.currentPosition = 100 - payload.currentPosition
    }
    if (!isNaN(parseInt(payload.targetPosition))) {
      this.values.targetPosition = 100 - payload.targetPosition
    }
    if (payload.state != null) {
      this.values.positionState = payload.state !== 4
        ? this.Characteristics.hap.PositionState.STOPPED
        : this.values.positionState = this.values.targetPosition > this.values.currentPosition
          ? this.Characteristics.hap.PositionState.INCREASING
          : this.Characteristics.hap.PositionState.DECREASING
    }
    if (payload.velocity != null) {
      this.values.motorSpeed = { slow: 0, default: 1, fast: 2 }[payload.velocity]
    }
  }
}

VeluxService.WindowCovering = WindowCovering
