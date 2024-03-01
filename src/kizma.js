#!/usr/bin/env node

import gen from './gen.js'
import getConf from './getConf.js'

const conf = getConf(process.argv)
gen(...conf)
