# Intro

This is a wrapper around the ndt client JS code, that allows selecting any server to run throughput tests.

In addition it also offers a few extra tools:
* a tool to check if the mic and webcam is set up correctly
* a whois lookup tool

# Quirks

* It needs to be updated manually each time the servers change. It
would be great if MLab would offer a clean js file with just the
servers, assuming that they are open to people using different GUIs
for their service, of which I'm not sure.
* It needs to be kept in sync with the official ndt client JS code.
This one is more than 1 year old. I don't know if anything has changed
in the meantime that might affect measurements.
* The latency measurement code is completely different from the ndt
latency measurement. I measure latency both before the transfers and
also during the upload and download, to detect bufferbloat. Last time
I checked, the NDT code was measuring latency only during one of the
transfers.

# Requirements

* An UNIX environment to run the deployment script (tested only on Ubuntu).
* Python 2.
* Java JRE, for running the YUI js minifier which is bundled as a JAR in the private directory.
* npm and firebase-tools, for deploying the project to Firebase. However any static HTTP hosting should work,
  in which case these are no longer needed.

# Installation

```
cd private
./publish.sh
```

This will:

1. Populate the `public` directory with the minified website files.
2. Deploy the `public` directory to Firebase. If you do not want to use Firebase, you can host the `public`
   directory on any other static HTTP server. In that case the `firebase deploy` step should be removed from the bash script.

## Testing

```
cd public
python -m SimpleHTTPServer 8080 .
```

Then open http://127.0.0.1:8080 in your web browser.

# Data

## MLab server list

This has to be updated manually by running `update-mlab-servers.py` in `private/data-scripts`.

## Throughput statistics by country

These were extracted from the NDT statistics with BigQuery, the code can be found in `private/data-scripts/readme.md`.

## Geolocation info

Extracted from MaxMind's GeoLite2-Country databse.

Code not provided yet.

## Whois info

Extracted from the dumps in `ftp://ftp.ripe.net/ripe/dbase/` and `ftp://ftp.ripe.net/radb/dbase/`.

Code not provided yet.

# License

See https://github.com/ndt-project/ndt/
