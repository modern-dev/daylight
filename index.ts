/*!
 * Daylight - is a tiny JavaScript library for basic sun/moon position/times/phase calculations.
 * https://github.com/modern-dev/daylight
 *
 * Copyright (c) 2020 Bohdan Shtepan
 * Licensed under the MIT license.
 */

const { sin, cos, tan, asin, acos, atan2, PI, round } = Math;
const rad = PI / 180;
const e = rad * 23.4397;

const dayMills = 1000 * 60 * 60 * 24;
const julian1970 = 2440588;
const julian2000 = 2451545;
const julian0 = 0.0009;
const sunsetAngle = -0.83 * rad;
const sunDiameter = 0.53 * rad;
const nauticalTwilightAngle = -6 * rad;
const astronomicalTwilightAngle = -12 * rad;
const darknessAngle = -18 * rad;

const toJulian = (date: Date): number => date.valueOf() / dayMills - 0.5 + julian1970;
const getDays = (date: Date): number => toJulian(date) - julian2000;
const getJulianCycle = (julian: number, lw: number) =>
  round(julian - julian2000 - julian0 - lw/(2 * PI));
const julianDateToDate = (juian: number): Date =>
  new Date((juian + 0.5 - julian1970) * dayMills);

const getRightAscension = (lon: number, lat: number): number =>
  atan2(sin(lon) * cos(e) - tan(lat) * sin(e), cos(lon));
const getDeclination = (lon: number, lat: number): number =>
  asin(sin(lat) * cos(e) + cos(lat) * sin(e) * sin(lon));
const getAzimuth = (h: number, phi: number, dec: number): number =>
  atan2(sin(h), cos(h) * sin(phi) - tan(dec) * cos(phi));
const getAltitude = (h: number, phi: number, dec: number): number =>
  asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(h));
const getSiderealTime = (d: number, lw: number): number =>
  rad * (280.16 + 360.9856235 * d) - lw;
const getSolarMeanAnomaly = (days: number): number =>
  rad * (357.5291 + 0.98560028 * days);
const hoursShift = (date: Date, hours: number): Date =>
  new Date(date.valueOf() + hours * dayMills / 24);
const getApproxSolarTransit = (ht: number, lw: number, julianCycle: number): number =>
  julian2000 + julian0 + (ht + lw)/(2 * PI) + julianCycle;
const getSunriseJulianDate = (julianTransit: number, julianSet: number): number =>
  julianTransit - (julianSet - julianTransit);
const getSolarTransit = (approxSolarTransit: number, solarMeanAnomaly: number, eclipticLongitude: number): number =>
  approxSolarTransit + (0.0053 * sin(solarMeanAnomaly)) + (-0.0069 * sin(2 * eclipticLongitude));
const getSunsetJulianDate = (w0: number, meanAnomaly: number, eclipticLongitude: number, lw: number, julianCycle: number): number =>
  getSolarTransit(getApproxSolarTransit(w0, lw, julianCycle), meanAnomaly, eclipticLongitude);
const getHourAngle = (hour: number, phi: number, declination: number): number =>
  acos((sin(hour) - sin(phi) * sin(declination)) / (cos(phi) * cos(declination)));
const getEquationOfCenter = (meanAnomaly: number): number =>
  rad * (1.9148 * sin(meanAnomaly) + 0.02 * sin(2 * meanAnomaly) + 0.0003 * sin(3 * meanAnomaly));

function getSolarEclipticLongitude(meanAnomaly: number): number {
  const centerEquation = getEquationOfCenter(meanAnomaly);
  const earthPerihelion = rad * 102.9372;

  return meanAnomaly + centerEquation + earthPerihelion + PI;
}

function getAstroRefraction(altitude: number): number {
  if (altitude < 0) {
    altitude = 0;
  }
  
  return 0.0002967 / tan(altitude + 0.00312536 / (altitude + 0.08901179));
}

function getSunCoords(days: number): SunCoordinates {
  const meanAnomaly = getSolarMeanAnomaly(days);
  const eclipticLongitude = getSolarEclipticLongitude(meanAnomaly);
  const declination = getDeclination(eclipticLongitude, 0);
  const rightAscension = getRightAscension(eclipticLongitude, 0);

  return {
    declination, rightAscension
  };
}

function getMoonCoords(days: number): MoonCoordinates {
  const eclipticLong = rad * (218.316 + 13.176396 * days);
  const meanAnomaly = rad * (134.963 + 13.064993 * days);
  const meanDistance = rad * (93.272 + 13.229350 * days);

  const long = eclipticLong + rad * 6.289 * sin(meanAnomaly);
  const lat = rad * 5.128 * sin(meanDistance);
  const distance = 385001 - 20905 * cos(meanAnomaly);

  return {
    rightAscension: getRightAscension(long, lat),
    declination: getDeclination(long, lat),
    distance
  };
}

type SunCoordinates = {
  declination: number;
  rightAscension: number;
};

/**
 * Represents sun position info.
 */
export type SunPosition = {
  /**
   * Sun azimuth in radians (direction along the horizon, measured from south to west),
   * e.g. 0 is south and Math.PI * 3/4 is northwes.
   */
  azimuth: number;

  /**
   * Sun altitude above the horizon in radians,
   * e.g. 0 at the horizon and PI/2 at the zenith (straight over your head).
   */
  altitude: number;
};

type TimeSpan = {
  start: Date;
  end: Date;
};

/**
 * Represents sun times info.
 */
export type SunTimes = {
  /**
   * Sunrise time (top edge of the sun appears on the horizon).
   */
  sunrise: TimeSpan;

  /**
   * Civil dawn time (the geometric center of the Sun's disk is 6 degrees below the horizon).
   */
  civilDawn: TimeSpan;

  /**
   * Nautical dawn time (the geometric center of the Sun's disk is 12 degrees below the horizon).
   */
  nauticalDawn: TimeSpan;

  /**
   * Astronomical dawn time (the geometric center of the Sun's disk is 18 degrees below the horizon).
   */
  astronomicalDawn: TimeSpan;

  /**
   * Dawn time.
   */
  dawn: Date;

  /**
   * Sunset time (bottom edge of the sun touches the horizon).
   */
  sunset: TimeSpan;

  /**
   * Civil dusk time (the geometric center of the Sun's disk is 6 degrees below the horizon).
   */
  civilDusk: TimeSpan;

  /**
   * Nautical dusk time (the geometric center of the Sun's disk is 12 degrees below the horizon).
   */
  nauticalDusk: TimeSpan;

  /**
   * Astronomical dusk (the geometric center of the Sun's disk is 18 degrees below the horizon).
   */
  astronomicalDusk: TimeSpan;

  /**
   * Dusk time.
   */
  dusk: Date;

  /**
   * Sun transit time.
   */
  transit: Date;
};

type MoonCoordinates = {
  rightAscension: number;
  declination: number;
  distance: number;
};

/**
 * Represents moon position info.
 */
export type MoonPosition = {
  /**
   * Moon azimuth in radians.
   */
  azimuth: number;

  /**
   * Moon altitude above the horizon in radians.
   */
  altitude: number;

  /**
   * Distance to moon in kilometers.
   */
  distance: number;

  /**
   * Parallactic angle of the moon in radians.
   */
  parallacticAngle: number;
};

/**
 * Represents moon phase info.
 */
export type MoonPhase = {
  /**
   * Illuminated fraction of the moon, range from 0.0 (new moon) to 1.0 (full moon).
   */
  fraction: number;

  /**
   * Moon phase, range from 0.0 (new moon), then 0.25 (first quarter),
   * then 0.5 (full moon), then 0.75 (last quarter), to 1.0.
   */
  phase: number;

  /**
   * Midpoint angle in radians of the illuminated limb of the moon
   * reckoned eastward from the north point of the disk;
   * the moon is waxing if the angle is negative, and waning if positive.
   */
  angle: number;
};

/**
 * Represents moon times info.
 */
export type MoonTimes = {
  /**
   * Moonrise time, if presented.
   */
  moonrise?: Date;

  /**
   * Moonset time, if presented.
   */
  moonset?: Date;

  /**
   * If presented, indicates whether the moon is alavays above the horizon during the day.
   */
  alwaysUp?: boolean;

  /**
   * if presented, idicates whether the moon is always below the horizon.
   */
  alwaysDown?: boolean;
};

/**
 * Returns an object containing sun position info.
 * 
 * @param {Date=} date - a point in time for which you wish to obtain sun position info.
 * @param {number} lat - the latitude of the location for which you wish to obtain sun position info.
 * @param {number} lon - the longitude of the location for which you wish to obtain sun position info.
 * @return {SunPosition} - Returns an object containing sun position info.
 */
function getSunPosition(date: Date, lat: number, lon: number): SunPosition {
  const lw = rad * -lon;
  const phi = rad * lat;
  const days = getDays(date || new Date());

  const sunnCoords = getSunCoords(days);
  const siderealTime = getSiderealTime(days, lw) - sunnCoords.rightAscension;

  const azimuth = getAzimuth(siderealTime, phi, sunnCoords.declination);
  const altitude = getAltitude(siderealTime, phi, sunnCoords.declination);

  return { azimuth, altitude };
}

/**
 * Returns an object containing sun times info.
 * 
 * @param {Date=} date - a point in time for which you wish to obtain sun times info.
 * @param {number} lat - the latitude of the location for which you wish to obtain sun times info.
 * @param {number} lon - the longitude of the location for which you wish to obtain sun times info.
 * @return {SunTimes} Returns an object containing sun times info.
 */
function getSunTimes(date: Date, lat: number, lon: number): SunTimes {
  const lw = -lon * rad;
  const phi = lat * rad;
  const julianDate = toJulian(date || new Date());

  const julianCycle = getJulianCycle(julianDate, lw);
  const approxSolarTransit = getApproxSolarTransit(0, lw, julianCycle);
  const solarMeanAnomaly = getSolarMeanAnomaly(approxSolarTransit - julian2000);
  const eclipticLongitude = getSolarEclipticLongitude(solarMeanAnomaly);
  const sunDeclination = asin(sin(eclipticLongitude) * sin(e));

  const julianTransit = getSolarTransit(approxSolarTransit, solarMeanAnomaly, eclipticLongitude);
  const w0 = getHourAngle(sunsetAngle, phi, sunDeclination);
  const w1 = getHourAngle(sunsetAngle + sunDiameter, phi, sunDeclination);
  const julianSet = getSunsetJulianDate(w0, solarMeanAnomaly, eclipticLongitude, lw, julianCycle);
  const julianSetStart = getSunsetJulianDate(w1, solarMeanAnomaly, eclipticLongitude, lw, julianCycle);
  const julianRise = getSunriseJulianDate(julianTransit, julianSet);
  const julianRiseEnd = getSunriseJulianDate(julianTransit, julianSetStart);
  const w2 = getHourAngle(nauticalTwilightAngle, phi, sunDeclination);
  const w3 = getHourAngle(astronomicalTwilightAngle, phi, sunDeclination);
  const w4 = getHourAngle(darknessAngle, phi, sunDeclination);
  const julianNautical = getSunsetJulianDate(w2, solarMeanAnomaly, eclipticLongitude, lw, julianCycle);
  const julianCivil = getSunriseJulianDate(julianTransit, julianNautical);
  const julianAstro = getSunsetJulianDate(w3, solarMeanAnomaly, eclipticLongitude, lw, julianCycle);
  const julianDark = getSunsetJulianDate(w4, solarMeanAnomaly, eclipticLongitude, lw, julianCycle);
  const julianNautical2 = getSunriseJulianDate(julianTransit, julianAstro);
  const julianAsto2 = getSunriseJulianDate(julianTransit, julianDark);

  return {
    sunrise: {
      start: julianDateToDate(julianRise),
      end: julianDateToDate(julianRiseEnd)
    },
    civilDawn: {
      start: julianDateToDate(julianCivil),
      end: julianDateToDate(julianRise)
    },
    nauticalDawn: {
      start: julianDateToDate(julianNautical2),
      end: julianDateToDate(julianCivil)
    },
    astronomicalDawn: {
      start: julianDateToDate(julianAsto2),
      end: julianDateToDate(julianNautical2)
    },
    dawn: julianDateToDate(julianCivil),
    sunset: {
      start: julianDateToDate(julianSetStart),
      end: julianDateToDate(julianSet)
    },
    civilDusk: {
      start: julianDateToDate(julianSet),
      end: julianDateToDate(julianNautical)
    },
    nauticalDusk: {
      start: julianDateToDate(julianNautical),
      end: julianDateToDate(julianAstro)
    },
    astronomicalDusk: {
      start: julianDateToDate(julianAstro),
      end: julianDateToDate(julianDark)
    },
    dusk: julianDateToDate(julianNautical),
    transit: julianDateToDate(julianTransit)
  };
}

/**
 * Returns an object containing moon position info.
 * 
 * @param {Date=} date - a point in time for which you wish to obtain moon position info.
 * @param {number} lat - the latitude of the location for which you wish to obtain moon position info.
 * @param {number} lon - the longitude of the location for which you wish to obtain moon position info.
 * @return {MoonPosition} - Returns an object containing moon position info.
 */
function getMoonPosition(date: Date, lat: number, lon: number): MoonPosition {
  const lw = rad * -lon;
  const phi = rad * lat;
  const days = getDays(date || new Date());

  const moonCoords = getMoonCoords(days);
  const siderealTime = getSiderealTime(days, lw) - moonCoords.rightAscension;
  let altitude = getAltitude(siderealTime, phi, moonCoords.declination);
  const parallacticAngle = atan2(sin(siderealTime), tan(phi) * cos(moonCoords.declination) -
    sin(moonCoords.declination) * cos(siderealTime));
  altitude = altitude + getAstroRefraction(altitude);
  const azimuth = getAzimuth(siderealTime, phi, moonCoords.declination);

  return {
    azimuth,
    altitude,
    distance: moonCoords.distance,
    parallacticAngle
  };
}

/**
 * Returns an object containing moon phase info.
 * 
 * @param {Date=} date - a point in time for which you wish to obtain moon phase info. 
 * @return {MoonPhase} Returns an object containing moon phase info.
 */
function getMoonPhase(date: Date): MoonPhase {
  const days = getDays(date || new Date());
  const sunCoords = getSunCoords(days);
  const moonCoords = getMoonCoords(days);
  const sunDistance = 149598000;

  const phi = acos(sin(sunCoords.declination) * sin(moonCoords.declination) + cos(sunCoords.declination) *
    cos(moonCoords.declination) * cos(sunCoords.rightAscension - moonCoords.rightAscension));
  const inc = atan2(sunDistance * sin(phi), moonCoords.distance - sunDistance * cos(phi));
  const angle = atan2(cos(sunCoords.declination) * sin(sunCoords.rightAscension - moonCoords.rightAscension),
    sin(sunCoords.declination) * cos(moonCoords.declination) - cos(sunCoords.declination) *
      sin(moonCoords.declination) * cos(sunCoords.rightAscension - moonCoords.rightAscension));
  
  return {
    fraction: (1 + cos(inc)) / 2,
    phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
    angle: angle
  };
}

/**
 * Returns an object containing moon times info for a given point in time and geo coordinates.
 * 
 * @param {Date=} date - a point in time for which you wish to obtain moon times info.
 * @param {number} lat - the latitude of the location for which you wish to obtain moon times info.
 * @param {number} lon - the longitude of the location for which you wish to obtain moon times info.
 * @return {MoonTimes} Returns an object containing moon tiems info.
 */
function getMoonTimes(date: Date, lat: number, lon: number): MoonTimes {
  date.setHours(0, 0, 0, 0);

  const hc = 0.133 * rad;
  let h0 = getMoonPosition(date, lat, lon).altitude - hc;
  let h1, h2, rise, set, a, b, xe, ye = 0, d, roots, x1 = 0, x2 = 0, dx;

  for (let i = 1; i <= 24; i += 2) {
    h1 = getMoonPosition(hoursShift(date, i), lat, lon).altitude - hc;
    h2 = getMoonPosition(hoursShift(date, i + 1), lat, lon).altitude - hc;

    a = (h0 + h2) / 2 - h1;
    b = (h2 - h0) / 2;
    xe = -b / (2 * a);
    ye = (a * xe + b) * xe + h1;
    d = b * b - 4 * a * h1;
    roots = 0;

    if (d >= 0) {
      dx = Math.sqrt(d) / (Math.abs(a) * 2);
      x1 = xe - dx;
      x2 = xe + dx;

      if (Math.abs(x1) <= 1) {
        roots++;
      }

      if (Math.abs(x2) <= 1) {
        roots++;
      }

      if (x1 < -1) {
        x1 = x2;
      }
    }

    if (roots === 1) {
      if (h0 < 0) {
        rise = i + x1;
      } else {
        set = i + x1;
      }

    } else if (roots === 2) {
      rise = i + (ye < 0 ? x2 : x1);
      set = i + (ye < 0 ? x1 : x2);
    }

    if (rise && set) {
      break;
    }

    h0 = h2;
  }

  const result: MoonTimes = {};

  if (rise) {
    result.moonrise = hoursShift(date, rise);
  }

  if (set) {
    result.moonset = hoursShift(date, set);
  }

  if (!rise && !set) {
    result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;
  }

  return result;
}

const sun = {
  getPosition: getSunPosition,
  getSunTimes: getSunTimes
};
const moon = {
  getPosition: getMoonPosition,
  getPhase: getMoonPhase,
  getTimes: getMoonTimes
};

export {
  sun, moon
}
