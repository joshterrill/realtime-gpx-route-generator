# Real-time GPX Route Generator

Simple web application that lets you type in a starting location, ending location, amount of time to pass, and number of steps, and generates a GPX file that contains all of the points of travel, and the correct times they would be reached for that distance.

Just replace `<YOUR API KEY HERE>` with your Google Maps geocode/javascript map API enabled key.

If you don't have a web server to host it on and just want to run it locally:

```bash
npm i -g http-server
http-server -c0
# navigate to http://localhost:8080
```

# License

MIT
