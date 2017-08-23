#!/usr/bin/env python2

import json
import re
import socket
import urllib2


whois_server_addr = None
def whois_lookup(ip):
  global whois_server_addr
  if not whois_server_addr:
    whois_server_addr = socket.getaddrinfo("whois.radb.net", 43, socket.AF_INET)[0][4][0]
  s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  s.connect((whois_server_addr, 43))
  s.send(ip + "\r\n\r\n")
  data = s.recv(32768)
  s.close()
  result = { "ip": ip }
  for line in data.split("\n"):
    parts = [ s.strip() for s in line.split(":", 1)]
    if len(parts) != 2:
      continue
    k = parts[0]
    v = parts[1]
    if k == "origin":
      result["asn"] = v
    elif k == "descr":
      result["asname"] = v
  return result


html = urllib2.urlopen("https://mlab-ns.appspot.com/admin/map/ipv4/ndt").read()
citiesJs = re.findall("var cities = .*;", html)[0]
cities = json.loads(re.findall("{.*}", citiesJs)[0])

by_city_asn = {}
by_asn_city = {}

for city in cities:
  sites = cities[city]
  for site in sites:
    site_id = site["site_id"]
    for server in site["sliver_tools"]:
      if server["status"] == "online":
        if "tool_id" not in server or "server_id" not in server or "slice_id" not in server:
          print "bad attributes", server
          continue
        tool_id = server["tool_id"]
        slice_id = server["slice_id"]
        if tool_id != "ndt" or slice_id != "iupui_ndt":
          print "bad tool", server
          continue
        server_id = server["server_id"]
        fqdn = tool_id + "-" + "iupui" + "-" + server_id + "-" + site_id + ".measurement-lab.org"
        server["fqdn"] = fqdn
        try:
          ips = list(set([ str(i[4][0]) for i in socket.getaddrinfo(fqdn, 80) ]))
        except KeyboardInterrupt:
          raise
        except:
          print "Could not resolve IP address for:", fqdn
          continue
        server["ips"] = ips
        whois = [ whois_lookup(ip) for ip in ips ]
        whois = [ e for e in whois if e ]
        if not whois:
          print "Could not resolve ASN for:", server
          continue
        asn = list(set([ e["asn"] for e in whois ]))
        asname = list(set([ e["asname"] for e in whois ]))
        if len(asn) > 1:
          print "Multiple ASN records for server:", server, "whois info:", whois
        asn = asn[0]
        asname = asname[0]
        if not asn:
          print "Could not resolve ASN for:", server, whois
          continue
        if not asname:
          nets = list(set([ e["net"] for e in whois ]))
          if nets:
            asname = nets[0]
        if len(asname) > 40:
          asname = " ".join(asname.split(" ")[0:4]) + "..."
        server["asn"] = asn
        server["asname"] = asname
        server["site_id"] = site_id
        server["site"] = site_id
        server["city"] = city
        if city not in by_city_asn:
          by_city_asn[city] = {}
        if asn not in by_city_asn[city]:
          by_city_asn[city][asn] = { "asname": asname, "servers": [] }
        by_city_asn[city][asn]["servers"].append(server)
        if asn not in by_asn_city:
          by_asn_city[asn] = { "asname": asname, "cities": {} }
        if city not in by_asn_city[asn]["cities"]:
          by_asn_city[asn]["cities"][city] = []
        by_asn_city[asn]["cities"][city].append(server)
        print "Found server:", fqdn, city, asn, asname


with open("../mlab-servers.js", "wt") as f:
  f.write("var ndtByCityAsn = ")
  f.write(json.dumps(by_city_asn, indent=2, sort_keys=True))
  f.write(";\n")
  f.write("var ndtByAsnCity = ")
  f.write(json.dumps(by_asn_city, indent=2, sort_keys=True))
  f.write(";\n")
