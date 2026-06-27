// homebridge-velux/lib/VeluxAccessory/Gateway.js
// Copyright © 2025-2026 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { timeout } from 'homebridge-lib'
import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate'

import { VeluxClient } from 'hb-velux-tools/VeluxClient'

import { VeluxAccessory } from './index.js'
import { VeluxService } from '../VeluxService/index.js'
import '../VeluxService/Gateway.js'

class Gateway extends AccessoryDelegate {
  constructor (platform, params = {}) {
    super(platform, params)
    this.nodeIdList = []
    this.accessories = {}

    this.client = new VeluxClient({
      host: params.host,
      logger: this,
      password: params.password,
      timeout: platform.config.timeout
    })
    this.client
      .on('notification', (notification) => {
        this.accessories?.[notification.payload?.nodeId]?.update(notification.payload)
      })

    this.service = new VeluxService.Gateway(this, {
      name: params.name
    })
    this.manageLogLevel(this.service.characteristicDelegate('logLevel'))

    this.on('heartbeat', this.heartbeat)
  }

  // Return ms to wait for KLF 200 gateway to restart
  #restartDelay () {
    if (!this.service.values.restart) {
      return 0
    }
    return this.service.values.restartTime + 30 * 1000 - Date.now()
  }

  async init () {
    try {
      const delta = this.#restartDelay()
      if (delta > 0) {
        this.log('waiting %ds for KLF 200 to restart...', Math.round(delta / 1000))
        await timeout(delta)
      }
      this.service.values.restart = false
      await this.client.connect()
      const { softwareVersion } = await this.client.request(VeluxClient.commands.GW_GET_VERSION_REQ)
      this.values.firmware = softwareVersion
      const { api } = await this.client.request(VeluxClient.commands.GW_GET_PROTOCOL_VERSION_REQ)
      await this.client.request(VeluxClient.commands.GW_SET_UTC_REQ)
      const nodes = {}
      let nodeList = await this.client.request(VeluxClient.commands.GW_CS_GET_SYSTEMTABLE_DATA_REQ)
      for (const node of nodeList) {
        nodes[node.nodeId] = node
      }
      nodeList = await this.client.request(VeluxClient.commands.GW_GET_ALL_NODES_INFORMATION_REQ)
      for (const node of nodeList) {
        Object.assign(nodes[node.nodeId], node)
      }
      this.log('KLF 200 v%s, api v%s: %d nodes', softwareVersion, api, Object.keys(nodes).length)
      for (const id in nodes) {
        const node = nodes[id]
        if (this.accessories[id] != null) {
          this.warn('%s [%s]: ignoring device with duplicate serial number', node.name, node.serialNumber)
          continue
        }
        this.nodeIdList.push(id)
        const params = {
          name: node.name,
          id: node.serialNumber,
          manufacturer: node.manufacturer,
          model: node.model,
          firmware: '' + node.buildNumber,
          payload: node
        }
        switch (node.actuatorType) {
          case 0x0280:
            if (VeluxAccessory.WindowCovering == null) {
              await import('./WindowCovering.js')
            }
            this.accessories[id] = new VeluxAccessory.WindowCovering(this, params)
            break
          default:
            this.warn(
              '%s [%s]: ignoring unsupported node type %d', node.name, node.serialNumber,
              node.actuatorType
            )
            continue
        }
      }
      if (this.nodeIdList.length > 0) {
        await this.client.request(VeluxClient.commands.GW_STATUS_REQUEST_REQ, {
          nodeIds: this.nodeIdList
        })
      }
      this.heartbeatEnabled = true
      this.initialised = true
      this.debug('initialised')
      this.emit('initialised')
    } catch (error) {
      if (!(error instanceof VeluxClient.Error)) {
        this.warn(error)
      }
      await this.client.disconnect()
      await timeout(60 * 1000)
      return this.init()
    }
  }

  async heartbeat (beat) {
    try {
      if (!this.client.connected) {
        if (beat % 60 !== 0) {
          return
        }
        if (this.#restartDelay() > 0) {
          return
        }
        await this.client.connect()
        if (this.service.values.restart) {
          await this.client.request(VeluxClient.commands.GW_SET_UTC_REQ)
          this.service.values.restart = false
        }
        if (this.nodeIdList.length > 0) {
          await this.client.request(VeluxClient.commands.GW_STATUS_REQUEST_REQ, {
            nodeIds: this.nodeIdList
          })
        }
      }
      if (beat % 600 === 0) {
        await this.client.request(VeluxClient.commands.GW_HOUSE_STATUS_MONITOR_ENABLE_REQ)
      }
      if (beat % this.service.values.heartrate === 0 && this.nodeIdList.length > 0) {
        await this.client.request(VeluxClient.commands.GW_STATUS_REQUEST_REQ, {
          nodeIds: this.nodeIdList
        })
      }
    } catch (error) {
      this.warn('heartbeat error %s', error)
    }
  }

  async shutdown () {
    this.service.values.restartTime = Date.now()
    this.service.values.restart = true
  }
}

VeluxAccessory.Gateway = Gateway
