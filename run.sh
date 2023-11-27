if [ "$(curl -s -o /dev/null -w "%{http_code}" https://api.seanmabli.com:3433/test)" = "200" ]; then
  echo "./gradlew is already running"
else
  ./gradlew run
fi
