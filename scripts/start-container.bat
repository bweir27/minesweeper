docker-compose build
docker-compose up --remove-orphans

docker stop brianweirdev-minesweeper-nodejs
docker stop brianweirdev-minesweeper-mongodb
docker stop brianweirdev-minesweeper-selenium-chrome
docker stop brianweirdev-minesweeper-selenium-firefox

docker-compose down
