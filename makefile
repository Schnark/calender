CONTENTS = img js lune-master suncalc-master index.html LICENSE.txt manifest.webapp style.css

.PHONY: all
all: calender.zip calender.manifest.webapp github.manifest.webapp

.PHONY: clean
clean:
	find . -name '*~' -delete

.PHONY: icons
icons: img/icon128.png img/icon512.png

img/icon128.png: icon.svg
	rsvg-convert -w 128 icon.svg -o img/icon128.png
	optipng img/icon128.png

img/icon512.png: icon.svg
	rsvg-convert -w 512 icon.svg -o img/icon512.png
	optipng img/icon512.png

calender.zip: clean icons $(CONTENTS)
	rm -f calender.zip
	zip -r calender.zip $(CONTENTS)

calender.manifest.webapp: manifest.webapp
	sed manifest.webapp -e 's/"launch_path"\s*:\s*"[^"]*"/"package_path": "http:\/\/localhost:8080\/calender.zip"/' > calender.manifest.webapp

github.manifest.webapp: manifest.webapp
	sed manifest.webapp -e 's/"launch_path"\s*:\s*"[^"]*"/"package_path": "https:\/\/schnark.github.io\/calender\/calender.zip"/' > github.manifest.webapp
