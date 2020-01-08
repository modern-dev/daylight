Daylight
========

![npm](https://img.shields.io/npm/v/@modern-dev/daylight)
![NPM](https://img.shields.io/npm/l/@modern-dev/daylight)

Daylight - is a tiny JavaScript library for basic sun/moon position/times/phase calculations.

```shell script
$ npm install -save @modern-dev/daylight
```

## :clipboard: Usage

```js
import { sun, moon } from '@modern-dev/daylight';

const sunPosition = sun.getPosition(new Date(), 90.0, 45.0);
console.log('Sun\'s altitude at the South Pole is ', sunPosition.altitude);

const moonPahse = moon.getPhase(new Date());
console.log('Today\'s moon phase is ', moonPhase.phase);
```

## :mortar_board: API Reference
*Will be added soon.*

## :green_book: License

[Licensed under the MIT license.](https://github.com/modern-dev/daylight/blob/master/LICENSE)

Copyright (c) 2020 Bohdan Shtepan

---

> [modern-dev.com](http://modern-dev.com) &nbsp;&middot;&nbsp;
> GitHub [@virtyaluk](https://github.com/virtyaluk) &nbsp;&middot;&nbsp;
> Twitter [@virtyaluk](https://twitter.com/virtyaluk)