function _ip2fixed(ip) {
  ip = String(ip);
  var parts = ip.split(".");
  for (var i in parts) {
    while (parts[i].length < 3) {
      parts[i] = "0" + parts[i];
    }
  }
  return parts.join(".");
}

function _ip2Binary(ip) {
  ip = String(ip);
  var parts = ip.split(".");
  for (var i in parts) {
    parts[i] = parseInt(parts[i]).toString(2);
    while (parts[i].length < 8) {
      parts[i] = "0" + parts[i];
    }
  }
  return parts.join("");
}

function _binary2Ip(binary) {
  binary = String(binary);
  var parts = [
        binary.substring(0, 8),
        binary.substring(8, 16),
        binary.substring(16, 24),
        binary.substring(24, 32)
      ];
  for (var i in parts) {
    parts[i] = parseInt(parts[i], 2);
  }
  return parts.join(".");
}

function _range2String(ip1, ip2) {
  var bin1 = _ip2Binary(ip1);
  var bin2 = _ip2Binary(ip2);
  for (var mask = 0; mask < 32; mask++) {
    if (bin1[mask] != bin2[mask])
      break;
  }
  for (var i = mask + 1; i < 32; i++) {
    bin1[i] = "0";
  }
  return _binary2Ip(bin1) + "/" + mask;
}

var cachedBlocks = {'whois':{}, 'geo':{}};
var cachedLookups = {'whois':{}, 'geo':{}};

function _lookupIpv4PrefixSync(db, ip, prefix, callback, fail) {
  if (cachedBlocks[db][prefix] instanceof Array) {
    var ipFixed = _ip2fixed(ip);
    var left = 0;
    var right = cachedBlocks[db][prefix].length - 1;
    while (left <= right) {
      var i = left + (right - left) / 2 | 0;
      var block = cachedBlocks[db][prefix][i];
      if (block.ip2Fixed < ipFixed) {
        left = i + 1;
        continue;
      }
      if (block.ip1Fixed > ipFixed) {
        right = i - 1;
        continue;
      }
      // Found
      cachedLookups[db][ip] = block;
      _lookupIp(db, ip, callback, fail);
      return;
    }
    fail("Not found");
  }
}

function _lookupIpv4Prefix(db, ip, prefix, callback, fail) {
  if (prefix in cachedBlocks[db]) {
    if (cachedBlocks[db][prefix]) {
      _lookupIpv4PrefixSync(db, ip, prefix, callback, fail);
    } else {
      setTimeout(_lookupIpv4Prefix, 100, db, ip, prefix, callback, fail);
    }
    return;
  }

  cachedBlocks[db][prefix] = 0;

  simpleAjax("GET",
             "/" + db + "/sharded/" + prefix + (prefix === "" ? "" : "/") + "all.txt",
             10000,
             "text",
             function(result) {
               var lines = result.split("\n");
               if (!cachedBlocks[db][prefix])
                 cachedBlocks[db][prefix] = [];
               for (var iLine in lines) {
                 var line = lines[iLine];
                 var tokens = line.split(" ");
                 if (tokens.length < 4)
                   continue;
                 var ip1 = tokens.shift();
                 var ip2 = tokens.shift();
                 var asn = tokens.shift();
                 var source = tokens.shift();
                 var descr = tokens.join(" ");
                 var ip1Fixed = _ip2fixed(ip1);
                 var ip2Fixed = _ip2fixed(ip2);
                 cachedBlocks[db][prefix].push({
                                             ip1: ip1,
                                             ip2: ip2,
                                             ip1Fixed: ip1Fixed,
                                             ip2Fixed: ip2Fixed,
                                             asn: asn,
                                             descr: descr,
                                             source: source
                                           });
               }
               cachedBlocks[db][prefix].sort(function(block1, block2) {
                 if (block1.ip1Fixed < block2.ip1Fixed)
                   return -1;
                 if (block1.ip1Fixed > block2.ip1Fixed)
                   return 1;
                 return 0;
               });
               _lookupIpv4PrefixSync(db, ip, prefix, callback, fail);
             },
             function() {
               cachedBlocks[db][prefix] = [];
               fail("Request failed");
             });
}

function _lookupIpv4(db, ip, callback, fail) {
  ip = String(ip);

  var prefix = ip.split(".", 1).join("/");
  _lookupIpv4Prefix(db, ip, prefix, callback, function() {
    _lookupIpv4Prefix(db, ip, "", callback, fail);
  });
}

function _lookupIp(db, ip, callback, fail) {
  ip = String(ip);

  if (ip in cachedLookups[db]) {
    var block = cachedLookups[db][ip];
    var net = _range2String(block.ip1, block.ip2);
    callback(ip, block.asn, block.descr, block.source, net);
    return;
  }

  if (ip.indexOf(".") > 0) {
    _lookupIpv4(db, ip, callback, fail);
  }
}

// callback(ip, asn, descr, source, net)
function lookupIp(ip, callback, fail) {
  _lookupIp("whois", ip, callback, fail);
}

// callback(ip, cc, country)
function geoIp(ip, callback, fail) {
  _lookupIp("geo",
            ip,
            function(ip, cc) {
              lookupCc(cc, function(cc, country) {
                callback(ip, cc, country);
              });
            },
            fail);
}

var cachedAsns = -1;

// callback(asn, name, descr)
function lookupAsn(asn, callback, fail) {
  if (cachedAsns === -1) {
    cachedAsns = 0;
    simpleAjax("GET",
               "/whois/as.json",
               10000,
               "json",
               function(result) {
                 cachedAsns = result;
                 setTimeout(lookupAsn, 0, asn, callback);
               }, function() {
                 cachedAsns = {};
                 fail("Request failed");
               });
  } else if (cachedAsns === 0) {
    setTimeout(lookupAsn, 100, asn, callback);
  } else {
    if (asn in cachedAsns) {
      callback(asn, cachedAsns[asn].n, cachedAsns[asn].d);
    } else {
      fail("Not found");
    }
  }
}

function cc2Continent(cc) {
  var map = {
    'AD': '150',
    'AE': '142',
    'AF': '142',
    'AG': '021',
    'AI': '021',
    'AL': '150',
    'AM': '142',
    'AN': '021',
    'AO': '002',
    'AP': '142',
    'AQ': '009',
    'AR': '005',
    'AS': '009',
    'AT': '150',
    'AU': '009',
    'AW': '021',
    'AX': '150',
    'AZ': '142',
    'BA': '150',
    'BB': '021',
    'BD': '142',
    'BE': '150',
    'BF': '002',
    'BG': '150',
    'BH': '142',
    'BI': '002',
    'BJ': '002',
    'BL': '021',
    'BM': '021',
    'BN': '142',
    'BO': '005',
    'BR': '005',
    'BS': '021',
    'BT': '142',
    'BV': '009',
    'BW': '002',
    'BY': '150',
    'BZ': '021',
    'CA': '021',
    'CC': '142',
    'CD': '002',
    'CF': '002',
    'CG': '002',
    'CH': '150',
    'CI': '002',
    'CK': '009',
    'CL': '005',
    'CM': '002',
    'CN': '142',
    'CO': '005',
    'CR': '021',
    'CU': '021',
    'CV': '002',
    'CX': '142',
    'CY': '142',
    'CZ': '150',
    'DE': '150',
    'DJ': '002',
    'DK': '150',
    'DM': '021',
    'DO': '021',
    'DZ': '002',
    'EC': '005',
    'EE': '150',
    'EG': '002',
    'EH': '002',
    'ER': '002',
    'ES': '150',
    'ET': '002',
    'EU': '150',
    'FI': '150',
    'FJ': '009',
    'FK': '005',
    'FM': '009',
    'FO': '150',
    'FR': '150',
    'FX': '150',
    'GA': '002',
    'GB': '150',
    'GD': '021',
    'GE': '142',
    'GF': '005',
    'GG': '150',
    'GH': '002',
    'GI': '150',
    'GL': '021',
    'GM': '002',
    'GN': '002',
    'GP': '021',
    'GQ': '002',
    'GR': '150',
    'GS': '009',
    'GT': '021',
    'GU': '009',
    'GW': '002',
    'GY': '005',
    'HK': '142',
    'HM': '009',
    'HN': '021',
    'HR': '150',
    'HT': '021',
    'HU': '150',
    'ID': '142',
    'IE': '150',
    'IL': '142',
    'IM': '150',
    'IN': '142',
    'IO': '142',
    'IQ': '142',
    'IR': '142',
    'IS': '150',
    'IT': '150',
    'JE': '150',
    'JM': '021',
    'JO': '142',
    'JP': '142',
    'KE': '002',
    'KG': '142',
    'KH': '142',
    'KI': '009',
    'KM': '002',
    'KN': '021',
    'KP': '142',
    'KR': '142',
    'KW': '142',
    'KY': '021',
    'KZ': '142',
    'LA': '142',
    'LB': '142',
    'LC': '021',
    'LI': '150',
    'LK': '142',
    'LR': '002',
    'LS': '002',
    'LT': '150',
    'LU': '150',
    'LV': '150',
    'LY': '002',
    'MA': '002',
    'MC': '150',
    'MD': '150',
    'ME': '150',
    'MF': '021',
    'MG': '002',
    'MH': '009',
    'MK': '150',
    'ML': '002',
    'MM': '142',
    'MN': '142',
    'MO': '142',
    'MP': '009',
    'MQ': '021',
    'MR': '002',
    'MS': '021',
    'MT': '150',
    'MU': '002',
    'MV': '142',
    'MW': '002',
    'MX': '021',
    'MY': '142',
    'MZ': '002',
    'NA': '002',
    'NC': '009',
    'NE': '002',
    'NF': '009',
    'NG': '002',
    'NI': '021',
    'NL': '150',
    'NO': '150',
    'NP': '142',
    'NR': '009',
    'NU': '009',
    'NZ': '009',
    'OM': '142',
    'PA': '021',
    'PE': '005',
    'PF': '009',
    'PG': '009',
    'PH': '142',
    'PK': '142',
    'PL': '150',
    'PM': '021',
    'PN': '009',
    'PR': '021',
    'PS': '142',
    'PT': '150',
    'PW': '009',
    'PY': '005',
    'QA': '142',
    'RE': '002',
    'RO': '150',
    'RS': '150',
    'RU': '150',
    'RW': '002',
    'SA': '142',
    'SB': '009',
    'SC': '002',
    'SD': '002',
    'SE': '150',
    'SG': '142',
    'SH': '002',
    'SI': '150',
    'SJ': '150',
    'SK': '150',
    'SL': '002',
    'SM': '150',
    'SN': '002',
    'SO': '002',
    'SR': '005',
    'ST': '002',
    'SV': '021',
    'SY': '142',
    'SZ': '002',
    'TC': '021',
    'TD': '002',
    'TF': '009',
    'TG': '002',
    'TH': '142',
    'TJ': '142',
    'TK': '009',
    'TL': '142',
    'TM': '142',
    'TN': '002',
    'TO': '009',
    'TR': '150',
    'TT': '021',
    'TV': '009',
    'TW': '142',
    'TZ': '002',
    'UA': '150',
    'UG': '002',
    'UM': '009',
    'US': '021',
    'UY': '005',
    'UZ': '142',
    'VA': '150',
    'VC': '021',
    'VE': '005',
    'VG': '021',
    'VI': '021',
    'VN': '142',
    'VU': '009',
    'WF': '009',
    'WS': '009',
    'YE': '142',
    'YT': '002',
    'ZA': '002',
    'ZM': '002',
    'ZW': '002'
  };
  if (map.hasOwnProperty(cc))
    return map[cc];
  return '';
}

var cachedCcs = -1;

// callback(cc, country)
function lookupCc(cc, callback, fail) {
  if (cachedCcs === -1) {
    cachedCcs = 0;
    simpleAjax("GET",
               "/geo/cc.json",
               10000,
               "json",
               function(result) {
                 cachedCcs = result;
                 setTimeout(lookupCc, 0, cc, callback);
               }, function() {
                 cachedCcs = {};
                 fail("Request failed");
               });
  } else if (cachedCcs === 0) {
    setTimeout(lookupCc, 100, asn, callback);
  } else {
    if (cc in cachedCcs) {
      callback(cc, cachedCcs[cc].n);
    } else {
      fail("Not found");
    }
  }
}

function findMyCc(success, fail) {
  getMyIPs(function(ips) {
    var bestIp = null;
    for (var i in ips) {
      var ip = ips[i];
      if (!ipIsPrivate(ip))
        bestIp = ip;
    }
    if (bestIp) {
      geoIp(bestIp, function(ip, cc, country) {
        success(cc, country);
      }, function(s) {
        fail("Could not find your country");
      });
    } else {
      fail("Could not find your country");
    }
  });
}

function whoisTest(ip) {
  lookupIp(ip, function(ip, asn, descr, source, net) {
    var ipDescr = descr;
    lookupAsn(asn, function(asn, name, descr) {
      log(ip + "ASN " + asn + " NAME " + name + " DESCR " + descr + " IPDESCR " + ipDescr + " NET " + net);
    }, log);
  }, log);
}

function geoTest(ip) {
  geoIp(ip, function(ip, cc, country) {
    log(ip + " CC " + cc + " COUNTRY " + country);
  }, log);
}
