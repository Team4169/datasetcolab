if [ "$(curl -s -o /dev/null -w "%{http_code}" https://api.seanmabli.com/test)" = "200" ]; then
  echo "./gradlew is already running"
else
  ./gradlew run
fi
