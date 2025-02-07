// homebridge-velux/lib/VeluxPlatform.js
// Copyright © 2025 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

// import { once } from 'node:events'

import { OptionParser } from 'homebridge-lib/OptionParser'
import { Platform } from 'homebridge-lib/Platform'

import { VeluxAccessory } from './VeluxAccessory/index.js'
import './VeluxAccessory/Gateway.js'

class VeluxPlatform extends Platform {
  constructor (log, configJson, homebridge) {
    super(log, configJson, homebridge)
    this.parseConfigJson(configJson)

    this.gateways = {}

    this
      .once('heartbeat', this.init)
      .on('shutdown', this.shutdown)
  }

  parseConfigJson (configJson) {
    this.config = {
      name: 'Velux',
      timeout: 15,
      hosts: []
    }
    const optionParser = new OptionParser(this.config, true)
    optionParser
      .stringKey('name')
      .stringKey('platform')
      .arrayKey('hosts')
      .intKey('timeout', 1, 60)
      .on('userInputError', (message) => {
        this.warn('config.json: %s', message)
      })
    try {
      optionParser.parse(configJson)
      const validHosts = []
      for (const i in this.config.hosts) {
        const host = this.config.hosts[i]
        const config = {
          port: 51200
        }
        const optionParser = new OptionParser(config, true)
        optionParser
          .hostKey()
          .stringKey('id', true)
          .stringKey('name', true)
          .stringKey('password')
          .on('userInputError', (error) => {
            this.warn('config.json: hosts[%d]: %s', i, error)
          })
        try {
          optionParser.parse(host)
          if (config.hostname == null || config.password == null) {
            continue
          }
          validHosts.push({
            host: config.hostname + ':' + config.port,
            name: config.name ?? config.hostname,
            id: config.id ?? config.hostname,
            password: config.password
          })
        } catch (error) {
          this.error(error)
        }
      }
      this.config.hosts = validHosts
      this.debug('config: %j', this.config)
    } catch (error) {
      this.error(error)
    }
  }

  async init (beat) {
    const jobs = []

    for (const host of this.config.hosts) {
      try {
        const gateway = new VeluxAccessory.Gateway(this, {
          name: host.name,
          id: host.id,
          manufacturer: 'VELUX',
          model: 'KLF 200',
          host: host.host,
          password: host.password
        })
        jobs.push(gateway.init())
        this.gateways[host] = gateway
      } catch (error) {
        this.error(error)
      }
    }
    for (const job of jobs) {
      await job
    }
    this.debug('initialised')
    this.emit('initialised')
  }

  async shutdown () {
    for (const id in this.gateways) {
      await this.gateways[id].shutdown()
    }
  }
}

export { VeluxPlatform }
