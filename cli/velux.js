#!/usr/bin/env node

// velux.js
//
// Command line interface to Velux Integra KLF 200 gateway.
// Copyright © 2025-2026 Erik Baauw. All rights reserved.

import { createRequire } from 'node:module'

import { VeluxTool } from 'hb-velux-tools/VeluxTool'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

new VeluxTool(packageJson).main()
