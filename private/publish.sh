#!/bin/bash

VER=$(git rev-parse --short --verify HEAD)
D="../public/"

rm -rf $D/* 2>/dev/null || true
mkdir $D 2>/dev/null || true

cp -r whois $D
cp -r geo $D
cp -r stats $D
cp -r flat-social-media-icons $D

cp favicon* $D
cp ndt.swf $D
cp empty.* $D

cat ndt-browser-client.js | java -jar yuicompressor-2.4.8.jar --type js > $D/ndt-browser-client.min.$VER.js
cat ndt-wrapper-ww.js | sed "s|ndt-browser-client.js|ndt-browser-client.min.$VER.js|g" | java -jar yuicompressor-2.4.8.jar --type js > $D/ndt-wrapper-ww.min.$VER.js

cat util.js gui.js mlab.js mlab-servers.js ndt-browser-client.js ndt-wrapper.js ndt-flash.js ndt-html5.js ndt-ping.js ndt-gui.js whois.js whois-gui.js media.js | sed "s|ndt-wrapper-ww.js|ndt-wrapper-ww.min.$VER.js|g" | java -jar yuicompressor-2.4.8.jar --type js > $D/script.min.$VER.js

cat fonts.css styles.css | tr -d '\n' > $D/styles.min.$VER.css

cat index.html | tr '\n' '\r' | sed "s|styles.css|styles.min.$VER.css|g" | sed "s|<!--scriptsstart.*scriptsend-->|<script src=\"script.min.$VER.js\"></script>|g" | perl -pe 's/<!--remove .*? remove-->//g' | perl -pe 's/<!--.*?-->//g' | tr '\r' '\n' > $D/index.html

cd $D
firebase deploy
