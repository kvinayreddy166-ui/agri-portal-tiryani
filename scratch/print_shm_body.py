with open("scratch/soil_health_meter.html", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

print(html[30500:33500])
