# Portal++ -  A Better Client for BlackBaud's [Learning Management System](https://k12hub.blackbaud.com/blackbaud-learning-management-system)

[![Netlify Status](https://api.netlify.com/api/v1/badges/2631dc5b-1742-4a40-885a-68cb125afa24/deploy-status)](https://app.netlify.com/sites/myschoolapp-better/deploys)


## Prototype
[portalplus.tech](https://portalplus.tech/)

## Features/Goals
  - [x] - Faster load speed
  - [ ] - Kanban-style assignment center (almost done!!!!)
  - [x] - Dark mode
  - [x] - Better mobile UI
  - [x] - No jQuery
  - [x] - Remembers last visited page
  - [x] - username autofill
  - [x] - no two-step login page
  - [ ] - API Docs (low priority)
  - [x] - Open-Source (GPLv3)

## development
### prerequisites:

[`netlify-cli`](https://www.npmjs.com/package/netlify-cli) must be installed

[`live-server`](https://www.npmjs.com/package/live-server) must be installed

[`yarn`](https://www.npmjs.com/package/yarn) must be installed

### dev environment
  - go to the project directory (where you've cloned this repo)
  - run `yarn install`
  - run `netlify dev`
    - this will start a live dev server on port 8888 (by default)
    - port `5500` must be available or it **WILL NOT WORK**
    - if you _really need_ port `5500` for something else, replace every instance of `5500` in `netlify.toml` with your own port
    - the frontend will be hosted at `/frontend/`, but when this is deployed, it'll be in `/`
  
  - I recommend installing an editor plugin similar to [this one](https://github.com/drmargarido/TodoTreeView) for viewing the todos

## contributing

  - add stuff
  - fix bugs
  - etc
  - make a pull request
  - if it adds jQuery you die
  - otherwise it will probably be merged
