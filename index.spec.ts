/*!
 * Daylight - is a tiny JavaScript library for basic sun/moon position/times/phase calculations.
 * https://github.com/modern-dev/daylight
 *
 * Copyright (c) 2020 Bohdan Shtepan
 * Licensed under the MIT license.
 */

import { sun, moon } from './index';
import { expect, use } from 'chai';
import 'mocha';

use(require('chai-almost')(0.01));
use(require('chai-datetime'));

describe('daylight', () => {
  let date: Date;
  let latitude: number;
  let longitude: number;
  
  beforeEach(() => {
    date = new Date('2019-02-09T20:00:00.00+02:00'); // 9th of February, 2019
    latitude = 40.74; // New York, Manhattan
    longitude = 74.00;
  });

  describe('sun object', () => {
    it('should calculate sun\'s position correctly', () => {
      const position = sun.getPosition(date, latitude, longitude);
      const expectedPosition = {
        azimuth: 2.46,
        altitude: -1.03
      };

      expect(position).not.to.be.null;
      expect(position.azimuth).to.almost.equal(expectedPosition.azimuth);
      expect(position.altitude).to.almost.equal(expectedPosition.altitude);
    });

    it('should calculate sun\'s times correctly', () => {
      const times = sun.getTimes(date, latitude, longitude);
      const expectedTimes = {
        dawn: new Date('2019-02-09T01:39:11.109Z'),
        dusk: new Date('2019-02-09T12:59:55.406Z'),
        sunrise: {
          end: new Date('2019-02-09T02:10:39.261Z')
        },
        sunset: {
          start: new Date('2019-02-09T12:28:27.253Z')
        },
        nauticalDawn: {
          start: new Date('2019-02-09T01:06:48.219Z')
        },
        nauticalDusk: {
          end: new Date('2019-02-09T13:32:18.296Z')
        }
      };
  
      expect(times).not.to.be.null;
      expect(times.dawn).to.equalDate(expectedTimes.dawn);
      expect(times.dusk).to.equalDate(expectedTimes.dusk);
      expect(times.sunset.start).to.equalDate(expectedTimes.sunset.start);
      expect(times.sunrise.end).to.equalDate(expectedTimes.sunrise.end);
      expect(times.nauticalDawn.start).to.equalDate(expectedTimes.nauticalDawn.start);
      expect(times.nauticalDusk.end).to.equalDate(expectedTimes.nauticalDusk.end);
    });
  });
  
  describe('moon object', () => {
    it('should calculate moon\'s position correctly', () => {
      const position = moon.getPosition(date, latitude, longitude);
      const expectedValues = {
        azimuth: 1.79,
        altitude: -0.22,
        distance: 395825.55,
        parallacticAngle: 0.83,
        latitude: -5.03,
        longitude: 10.08,
        zodiacSign: 'Aries'
      };
  
      expect(position).not.to.be.null;
      expect(position.azimuth).to.almost.equal(expectedValues.azimuth);
      expect(position.altitude).to.almost.equal(expectedValues.altitude);
      expect(position.distance).to.almost.equal(expectedValues.distance);
      expect(position.parallacticAngle).to.almost.equal(expectedValues.parallacticAngle);
      expect(position.latitude).to.almost.equal(expectedValues.latitude);
      expect(position.longitude).to.almost.equal(expectedValues.longitude);
      expect(position.zodiacSign).to.be.equal(expectedValues.zodiacSign);
    });
  
    it('should calculate moon\'s phase correctly', () => {
      const phase = moon.getPhase(date);
      const expectedPhase = {
        fraction: 0.21,
        phase: 0.15,
        angle: -1.90
      };
  
      expect(phase).not.to.be.null;
      expect(phase.fraction).to.almost.equal(expectedPhase.fraction);
      expect(phase.phase).to.almost.equal(expectedPhase.phase);
      expect(phase.angle).to.almost.equal(expectedPhase.angle);
    });
  
    it('should calculate moon\'s times correctly', () => {
      const times = moon.getTimes(date, latitude, longitude);
      const expectedTimes = {
        moonrise: new Date('2019-02-09T04:29:37.076Z'),
        moonset: new Date('2019-02-09T16:50:15.974Z')
      };
      
      expect(times).not.to.be.null;
      expect(times.moonrise).to.equalDate(expectedTimes.moonrise);
      expect(times.moonset).to.equalDate(expectedTimes.moonset);
    });

    it('should calculate moon is always down on the South Pole', () => {
      const times = moon.getTimes(new Date(2019, 0, 1), 90, 45);

      expect(times).not.to.be.null;
      expect(times.alwaysDown).to.be.true;
    });
  });
});
