// homebridge-velux/lib/VeluxAccessory/Gateway.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { timeout, toHexString } from 'homebridge-lib'
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
      password: params.password,
      timeout: platform.config.timeout
    })
    this.client
      .on('connecting', (host) => { this.log('connecting to %s...', host) })
      .on('connect', (host) => { this.log('connected to %s', host) })
      .on('disconnect', (host) => { this.log('disconnected from %s', host) })
      .on('error', (error) => {
        if (error.request == null) {
          this.error('error: %s', error)
          return
        }
        if (error.request.params == null) {
          this.log('request %d: %s', error.request.id, error.request.cmdName)
        } else {
          this.log(
            'request %d: %s %j', error.request.id, error.request.cmdName,
            error.request.params
          )
        }
        this.warn('request %d: error: %s', error.request.id, error)
      })
      .on('warning', (error) => {
        if (error.request == null) {
          this.warn('error: %s', error)
          return
        }
        if (error.request.params == null) {
          this.log('request %d: %s', error.request.id, error.request.cmdName)
        } else {
          this.log(
            'request %d: %s %j', error.request.id, error.request.cmdName,
            error.request.params
          )
        }
        this.warn('request %d: error: %s', error.request.id, error)
      })
      .on('request', (request) => {
        if (request.params == null) {
          this.debug('request %d: %s', request.id, request.cmdName)
        } else {
          this.debug(
            'request %d: %s %j', request.id, request.cmdName, request.params
          )
        }
        if (request.data == null) {
          this.vdebug(
            'request %d: %s [%s]', request.id, request.cmdName,
            toHexString(request.cmd, 4)
          )
        } else {
          this.vdebug(
            'request %d: %s [%s]: %s', request.id, request.cmdName,
            toHexString(request.cmd, 4), toHexString(request.data)
          )
        }
      })
      .on('response', (response) => {
        if (response.response == null) {
          this.debug('request %d: ok', response.request.id)
        } else {
          this.debug(
            'request %d: response: %j', response.request.id, response.response
          )
        }
      })
      .on('rawNotification', (notification) => {
        const req = notification.request != null
          ? 'request ' + notification.request.id + ': '
          : ''
        if (notification.data == null) {
          this.vdebug(
            '%s%s [%s]', req, notification.cmdName,
            toHexString(notification.cmd, 4)
          )
        } else {
          this.vdebug(
            '%s%s [%s]: %s', req, notification.cmdName,
            toHexString(notification.cmd, 4), toHexString(notification.data)
          )
        }
      })
      .on('notification', (notification) => {
        const req = notification.request != null
          ? 'request ' + notification.request.id + ': '
          : ''
        if (notification.payload == null) {
          this.debug('%s%s', req, notification.cmdName)
        } else {
          this.debug('%s%s: %j', req, notification.cmdName, notification.payload)
        }
        this.accessories?.[notification.payload?.nodeId]?.update(notification.payload)
      })
      .on('send', (data) => {
        this.vvdebug('send %s', toHexString(data))
      })
      .on('data', (data) => {
        this.vvdebug('received %s', toHexString(data))
      })

    this.service = new VeluxService.Gateway(this, {
      name: params.name
    })
    this.manageLogLevel(this.service.characteristicDelegate('logLevel'))

    this.on('heartbeat', this.heartbeat)
  }

  async init () {
    try {
      this.log('connecting...')
      await this.client.connect()
      const { softwareVersion } = await this.client.request(VeluxClient.commands.GW_GET_VERSION_REQ)
      this.values.firmware = softwareVersion
      const { api } = await this.client.request(VeluxClient.commands.GW_GET_PROTOCOL_VERSION_REQ)
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
        this.nodeIdList.push(id)
        const node = nodes[id]
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
      this.service.values.restart = false
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
      await timeout(600 * 1000)
      return this.init()
    }
  }

  async heartbeat (beat) {
    try {
      if (!this.client.connected) {
        if (beat % 60 !== 0) {
          return
        }
        await this.client.connect()
        this.service.values.restart = false
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
    try {
      await this.client.request(VeluxClient.commands.GW_REBOOT_REQ)
    } catch (error) { this.warn(error) }
    return this.client.disconnect()
  }
}

VeluxAccessory.Gateway = Gateway
