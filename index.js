// homebridge-velux/index.js
// Copyright © 2025-2026 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Velux Integra KLF 200 gateway.

import { createRequire } from 'node:module'

import { VeluxPlatform } from './lib/VeluxPlatform.js'

const require = createRequire(import.meta.url)
const packageJson = require('./package.json')

function main (homebridge) {
  VeluxPlatform.loadPlatform(homebridge, packageJson, 'Velux', VeluxPlatform)
}

export { main as default }
