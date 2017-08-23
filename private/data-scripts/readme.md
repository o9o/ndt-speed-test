# Download throughput by country

```
SELECT
  connection_spec.client_geolocation.country_code AS CountryCode,
  ROUND((web100_log_entry.snap.HCThruOctetsAcked * 8) /
        (web100_log_entry.snap.SndLimTimeRwin + web100_log_entry.snap.SndLimTimeCwnd + web100_log_entry.snap.SndLimTimeSnd) / 10) * 10 AS Throughput,
  COUNT(*) AS Count
  FROM
    plx.google:m_lab.ndt.all
  WHERE
    -- NDT
    project = 0 AND
    -- Server to client (download)
    --test_id CONTAINS 's2c' AND
    IS_EXPLICITLY_DEFINED(connection_spec.data_direction) AND
    connection_spec.data_direction = 1 AND
    -- Last row in table
    IS_EXPLICITLY_DEFINED(web100_log_entry.is_last_entry) AND
    web100_log_entry.is_last_entry = True AND
    -- Geolocation succeeded
    LENGTH(connection_spec.client_geolocation.country_code) = 2 AND
    -- The TCP connection was established normally
    (web100_log_entry.snap.State == 1 OR
     (web100_log_entry.snap.State >= 5 AND web100_log_entry.snap.State <= 11)) AND
    -- At least 8k were sent
    IS_EXPLICITLY_DEFINED(web100_log_entry.snap.HCThruOctetsAcked) AND
    web100_log_entry.snap.HCThruOctetsAcked >= 8192 AND
    -- Test did not fail (ran for >= 9 seconds)
    (web100_log_entry.snap.SndLimTimeRwin +
     web100_log_entry.snap.SndLimTimeCwnd +
     web100_log_entry.snap.SndLimTimeSnd) >= 9 * POW(10, 6) AND
    -- Test stopped normally (ran for <= 1 hour)
    (web100_log_entry.snap.SndLimTimeRwin +
     web100_log_entry.snap.SndLimTimeCwnd +
     web100_log_entry.snap.SndLimTimeSnd) < 3600 * POW(10, 6) AND
    -- Data is sane
    IS_EXPLICITLY_DEFINED(web100_log_entry.snap.SegsRetrans) AND
    IS_EXPLICITLY_DEFINED(web100_log_entry.snap.DataSegsOut) AND
    web100_log_entry.snap.DataSegsOut > 0  AND
    web100_log_entry.snap.SegsRetrans < web100_log_entry.snap.DataSegsOut
    -- Extra filter
    AND YEAR(UTC_USEC_TO_YEAR(web100_log_entry.log_time * 1000000)) >= 2015
  GROUP BY
    CountryCode, Throughput
  ORDER BY
    CountryCode ASC, Throughput ASC
;
```

# Upload throughput by country

```
SELECT
  connection_spec.client_geolocation.country_code AS CountryCode,
  ROUND(web100_log_entry.snap.HCThruOctetsReceived * 8 / web100_log_entry.snap.Duration / 10) * 10 AS Throughput,
  COUNT(*) AS Count
  FROM
    plx.google:m_lab.ndt.all
  WHERE
    -- NDT
    project = 0 AND
    -- Client to server (upload)
    --test_id CONTAINS 'c2s' AND
    IS_EXPLICITLY_DEFINED(connection_spec.data_direction) AND
    connection_spec.data_direction = 0 AND
    -- Last row in table
    IS_EXPLICITLY_DEFINED(web100_log_entry.is_last_entry) AND
    web100_log_entry.is_last_entry = True AND
    -- Geolocation succeeded
    LENGTH(connection_spec.client_geolocation.country_code) = 2 AND
    -- The TCP connection was established normally
    (web100_log_entry.snap.State == 1 OR
     (web100_log_entry.snap.State >= 5 AND web100_log_entry.snap.State <= 11)) AND
    -- At least 8k were received
    IS_EXPLICITLY_DEFINED(web100_log_entry.snap.HCThruOctetsReceived) AND
    web100_log_entry.snap.HCThruOctetsReceived >= 8192 AND
    -- Test did not fail (ran for >= 9 seconds)
    IS_EXPLICITLY_DEFINED(web100_log_entry.snap.Duration) AND
    web100_log_entry.snap.Duration >= 9 * POW(10, 6) AND
    -- Test stopped normally (ran for <= 1 hour)
    web100_log_entry.snap.Duration < 3600 * POW(10, 6)
    -- extra filter
    AND YEAR(UTC_USEC_TO_YEAR(web100_log_entry.log_time * 1000000)) >= 2015
  GROUP BY
    CountryCode, Throughput
  ORDER BY
    CountryCode ASC, Throughput ASC
;
```
