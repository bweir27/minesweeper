# Minesweeper
A repository containing a version of Minesweeper I made

## Overview

## Build & development

Run `gulp build` for building and `gulp buildcontrol:heroku` to deploy to Heroku.

### Developing

1. Run `yarn install` to install server dependencies.
2. With [Docker](https://www.docker.com/) running, navigate to `/scripts`
3. Run `./start-container` to start the Docker container
    1. Note: Windows users may instead need to run `./start-container.bat`
4. Once the Docker container is running, open a new terminal tab and (from the same working directory) run `./attach-container`
    1. Note: Windows users may need to run `./attach-container.bat`
5. Run `cd app/brianweirdevminesweeper/`
6. Run `npm run start:client` to run the development client application. 
7. In your browser, navigate to [http://0.0.0.0:8080](http://0.0.0.0:8080) to view the application.

## References
- The game board dimensions and bomb counts for each level of difficulty are in accordance with the [classic Minesweeper](https://minesweeperonline.com/) game, as described in this [DataGenetics article](https://datagenetics.com/blog/june12012/index.html)
- If a bomb is clicked on the first turn, the bomb is moved to a corner as per [convention](https://web.archive.org/web/20180618103640/http://www.techuser.net/mineclick.html)
