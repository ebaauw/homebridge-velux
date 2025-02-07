<p align="center">
  <img src="homebridge-velux.png" height="200px">  
</p>
<span align="center">

# Homebridge Velux
[![Downloads](https://img.shields.io/npm/dt/homebridge-velux)](https://www.npmjs.com/package/homebridge-velux)
[![Version](https://img.shields.io/npm/v/homebridge-velux)](https://www.npmjs.com/package/homebridge-velux)
[![Homebridge Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/bXmnUwXQR9)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

[![GitHub issues](https://img.shields.io/github/issues/ebaauw/homebridge-velux)](https://github.com/ebaauw/homebridge-velux/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/ebaauw/homebridge-velux)](https://github.com/ebaauw/homebridge-velux/pulls)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen)](https://standardjs.com)

</span>

## Homebridge plugin for Velux Integra KLF 200 gateway
Copyright © 2025 Erik Baauw. All rights reserved.

This [Homebridge](https://github.com/homebridge/homebridge) plugin exposes to Apple's [HomeKit](http://www.apple.com/ios/home/) Velux Integra devices connected to a Velux Integra KLF 200 gateway.  The KLF 200 provides a local API, unlike the newer Velux Active gateway.  This plugin does not support the Velux Active gateway.

Currenlty, Homebridge Velux supports motorised roller blinds.

It provides the following features:
- Monitoring the connected device state from HomeKit
  - Current position;
- Controlling the connected device from HomeKit:
  - Setting target position;
- Support for multiple KLF 200 gateways;
- Includes `velux` command-line utility for troubleshooting.

Homebridge Velux exposes an accessory for each gateway and one for each connected device.
The gateway accessory is used to control the polling rate and the log level.
<!-- See the [Wiki](https://github.com/ebaauw/homebridge-velux/wiki/Velux-Accessory) for details. -->

### Prerequisites
Homebridge Velux communicates with the Velux Integra KLF 200 gateway using its local API, described in the _Technical Specification for KLF 200 API io-homecontrol® Gateway_ version 3.18 from 2019/12/10.  The gatway needs to be at firmware version [2.0.0.71](https://www.velux.com/klf200).

You need to connect the KLF 200 to your network using its wired Ethernet interface, as the API is only exposed on this interface.
The WiFi interface only works as an access point.
The web-based configuration of the gateway, including pairing devices, is only available on the WiFi interface.

Note that the API password is the password of the WiFi access point, not that of on the web-based configuration.

### Configuration
Homebridge Velux needs a list of KLF 200 gateways, and their WiFi passwords.
<!-- See the [Wiki](https://github.com/ebaauw/homebridge-velux/wiki/Configuration) for details. -->

Best configure Homebridge Velux through the Homebridge UI.

### Command-Line Utility
Homebridge Velux include the `velux` command line utility, to interact with a KLF 200 gateway.
Run `velux -h` for more info.

### Troubleshooting
Make sure your KLF 200 gateway has been configured correctly, before setting up Homebridge Velux.
<!-- See the [Wiki](https://github.com/ebaauw/homebridge-velux/wiki/Gateway-Setup) for details. -->
I do not have the bandwidth to provide support on setting up your gateway.

I developed this plugin for my solar-powered, motorised back-out roller blinds.
I would expect Homebridge Velux to work with other blinds, as long as they use the same actuator type, 640.

If you like support for other device types, please open an [issue](https://github.com/ebaauw/homebridge-velux/issues) on GitHub, listing the output of `velux info`.

#### Getting Help
I do not have the bandwidth to help you setting up your KLF 200 gateway.

<!-- If you have a question about Homebridge Velux, please post a message to the **#velux** channel of the Homebridge community on [Discord](https://discord.gg/bXmnUwXQR9). -->

If you encounter a problem with Homebridge Velux, or want to request a feature or support for a particular device, please open an issue on [GitHub](https://github.com/ebaauw/homebridge-velux/issues).
Please include the output of `velux info` and the relevant messages in the Homebridge log.
