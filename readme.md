# Portal++ -  A Better Client for BlackBaud's [Learning Management System](https://k12hub.blackbaud.com/blackbaud-learning-management-system)

[![Netlify Status](https://api.netlify.com/api/v1/badges/2631dc5b-1742-4a40-885a-68cb125afa24/deploy-status)](https://app.netlify.com/sites/myschoolapp-better/deploys)


## Prototype
[portalplus.tech](https://portalplus.tech/)

## Features/Goals
  - [x] Faster load speed
  - [x] Kanban-style assignment center
  - [x] Dark mode
  - [x] Better mobile UI
  - [x] Multiple themes, which use CSS variables
  - [x] No jQuery
  - [x] Remembers last visited page
  - [x] username autofill
  - [x] no two-step login page
  - [ ] API Docs (low priority)
  - [x] Open-Source (GPLv3)

## development
### prerequisites

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
  #### Recommended:
- set `user.debug_mode` to `true`
- give `user.default_description` a value (can be fetched from `test_data/test_description.txt`)
- install an editor plugin similar to [this one](https://github.com/drmargarido/TodoTreeView) for viewing the todos

## contributing

  - add stuff
  - fix bugs
  - etc
  - make a pull request
  - if it adds jQuery you die
  - indent with tabs
  - otherwise it will probably be merged
