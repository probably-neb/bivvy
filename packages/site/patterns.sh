#!/usr/bin/env bash

JS_FILE="/tmp/patterns.js"
JSON_FILE="/tmp/patterns.json"
header="class Vue { constructor(config) { require('fs').writeFileSync('${JSON_FILE}', JSON.stringify(config.data.patterns)); } } "
echo "${header}" > "${JS_FILE}"
url="https://heropatterns.com/js/app.js"
curl -s "${url}" | head -n -1 | tail -n +2 >> "${JS_FILE}"
node "${JS_FILE}"
cat ${JSON_FILE} | jq --raw-output -c '.[] | @sh "echo \(.image) > ./public/patterns/\(.name | ascii_downcase | gsub(" "; "-"; "g")).svg"' | bash
cat ${JSON_FILE} | jq --raw-output -c 'map(.name | ascii_downcase | gsub(" "; "-"; "g"))' > ./public/patterns/index.json
