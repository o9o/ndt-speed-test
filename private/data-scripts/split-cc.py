#!/usr/bin/env python2

import csv
import json
import sys

name = sys.argv[1]

data = {}
with open(name + '.csv', 'rb') as csvin:
  reader = csv.reader(csvin)
  for row in reader:
    if len(row[0]) == 2:
      cc = row[0]
      val = row[1]
      count = row[2]
      if cc not in data:
        data[cc] = []
      data[cc].append([val, count])

for cc in data:
  with open(name + '-' + cc + '.json', 'wb') as fout:
    fout.write(json.dumps(data[cc]))
