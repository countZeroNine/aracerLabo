// aRacer .loga parser
export const detectLogFormat = (text) => {
  const firstLine = text.split("\n", 1)[0].trim();
  if (firstLine.startsWith("<aRacer APP Log Data for RaceAMP>"))       return "aracer_sp";
  if (firstLine.startsWith("<Cycling Memory Log Data of Super ECU>"))   return "aracer_ecu";
  if (firstLine.startsWith("<ECU Memory Log Data of Super ECU>"))       return "aracer_ecu";
  if (firstLine.startsWith("<aRacer ECU_Memory Log Data for RaceAMP>")) return "aracer_lm";
  return "unknown";
};

export const parseAracerLog = (text, format) => {
  const lines = text.split(/\r?\n/);
  if (lines.length < 8) throw new Error("aRacer ログのデータ行が不足しています");

  const headers = lines[5].split(",");
  const normalizeHeader = (h) => {
    const beforeSlash = h.split("/")[0];
    const afterDot = beforeSlash.split(".").pop();
    return afterDot.trim().toLowerCase();
  };
  const normalizedHeaders = headers.map(normalizeHeader);
  const findIdx = (...patterns) => {
    for (const p of patterns) {
      const idx = normalizedHeaders.indexOf(p.toLowerCase());
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idx = {
    Rpm:          findIdx("rpm"),
    Speed:        findIdx("vehicle_speed_filtered", "vehicle_speed", "gps_speed"),
    Afr:          findIdx("afr_wbo2_cal", "afr"),
    AfrTarget:    findIdx("afr"),
    AfrAlt:       findIdx("af1_afr"),
    NbO2Volt:     findIdx("nbo2_volt"),
    Tps:          findIdx("tps_percent"),
    Volt:         findIdx("volt_batt_indx"),
    AirTemp:      findIdx("t_air_indx"),
    Lap:          findIdx("ir_lapnumber"),
    LapTime:      findIdx("ir_laptime"),
    Gear:         findIdx("gearnum"),
    LeanAngle:    findIdx("tc_lean_angle"),
    MapNum:       findIdx("mapnum"),
    Wbo2AtEn:     findIdx("wbo2_at_en"),
    Wbo2Ready:    findIdx("wbo2_ready"),
    PowerEn:      findIdx("power_en"),
    RpmLimit:     findIdx("rpm_limit"),
    FuelCutDec:   findIdx("dec_fc_en"),
    GpsLatDecimal: findIdx("gps_latitude"),
    GpsLonDecimal: findIdx("gps_longitude"),
    GpsLatDeg:    findIdx("gps_lat_deg"),
    GpsLatMin:    findIdx("gps_lat_min"),
    GpsLatMmmm:   findIdx("gps_lat_mmmm"),
    GpsLatNS:     findIdx("gps_lat_ns"),
    GpsLonDeg:    findIdx("gps_lon_deg"),
    GpsLonMin:    findIdx("gps_lon_min"),
    GpsLonMmmm:   findIdx("gps_lon_mmmm"),
    GpsLonEW:     findIdx("gps_lon_ew"),
    GpsSpeed:     findIdx("gps_speed"),
  };
  const hasGpsDecimal = idx.GpsLatDecimal >= 0 && idx.GpsLonDecimal >= 0;
  const hasGpsDms = idx.GpsLatDeg >= 0 && idx.GpsLonDeg >= 0;

  const probeRows = Math.min(100, lines.length - 7);
  let sampleStride = 1;
  if (probeRows > 10) {
    const t0 = parseFloat(lines[6].split(",")[0]);
    const tEnd = parseFloat(lines[6 + probeRows - 1].split(",")[0]);
    if (!isNaN(t0) && !isNaN(tEnd) && tEnd > t0) {
      const hz = (probeRows - 1) / ((tEnd - t0) / 1000);
      if (hz > 12) sampleStride = Math.max(1, Math.round(hz / 10));
    }
  }

  const data = [];
  for (let li = 6; li < lines.length; li += sampleStride) {
    const line = lines[li];
    if (!line || !line.length) continue;
    const parts = line.split(",");
    const tMs = parseFloat(parts[0]);
    if (isNaN(tMs)) continue;

    const num = (i) => i >= 0 && i < parts.length ? (parseFloat(parts[i]) || 0) : 0;
    const intNum = (i) => i >= 0 && i < parts.length ? (parseInt(parts[i], 10) || 0) : 0;

    let lat = NaN, lon = NaN;
    if (hasGpsDecimal) {
      const _lat = num(idx.GpsLatDecimal), _lon = num(idx.GpsLonDecimal);
      if (_lat >= -90 && _lat <= 90 && _lon >= -180 && _lon <= 180 &&
          !(Math.abs(_lat) < 0.01 && Math.abs(_lon) < 0.01)) {
        lat = _lat; lon = _lon;
      }
    } else if (hasGpsDms) {
      const lDeg = num(idx.GpsLatDeg), lMin = num(idx.GpsLatMin), lMmm = num(idx.GpsLatMmmm);
      const oDeg = num(idx.GpsLonDeg), oMin = num(idx.GpsLonMin), oMmm = num(idx.GpsLonMmmm);
      const ns = intNum(idx.GpsLatNS), ew = intNum(idx.GpsLonEW);
      let _lat = lDeg + (lMin + lMmm / 10000) / 60;
      let _lon = oDeg + (oMin + oMmm / 10000) / 60;
      if (ns === 83) _lat = -_lat;
      if (ew === 87) _lon = -_lon;
      if (_lat >= -90 && _lat <= 90 && _lon >= -180 && _lon <= 180 &&
          !(Math.abs(_lat) < 0.01 && Math.abs(_lon) < 0.01)) {
        lat = _lat; lon = _lon;
      }
    }

    data.push({
      RunTime:    tMs / 1000,
      Rpm:        num(idx.Rpm),
      Speed:      num(idx.Speed),
      Afr:        num(idx.Afr),
      AfrTarget:  num(idx.AfrTarget),
      AfrAlt:     num(idx.AfrAlt),
      NbO2Volt:   num(idx.NbO2Volt),
      Tps:        num(idx.Tps),
      Volt:       num(idx.Volt),
      AirTemp:    num(idx.AirTemp),
      Gear:       intNum(idx.Gear),
      LeanAngle:  num(idx.LeanAngle),
      Lap:        intNum(idx.Lap),
      MapNum:     intNum(idx.MapNum),
      Wbo2AtEn:   intNum(idx.Wbo2AtEn),
      Wbo2Ready:  intNum(idx.Wbo2Ready),
      PowerEn:    intNum(idx.PowerEn),
      RpmLimit:   intNum(idx.RpmLimit),
      FuelCutDec: intNum(idx.FuelCutDec),
      Lat: lat,
      Lon: lon,
      GpsSpeed:   num(idx.GpsSpeed),
    });
  }

  const gpsValidCount = data.filter(d => !isNaN(d.Lat) && !isNaN(d.Lon)).length;
  const hasValidGps = gpsValidCount > Math.max(10, data.length * 0.05);

  return { data, format, sampleStride, totalRows: lines.length - 6, hasValidGps, gpsValidCount };
};
