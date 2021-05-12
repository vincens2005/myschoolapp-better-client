# Portal++ -  A Better Client for BlackBaud's MySchoolApp Portal

todo: prototype link


## development
### prerequisites:


[`netlify-cli`](https://www.npmjs.com/package/netlify-cli) must be installed

[`live-server`](https://www.npmjs.com/package/live-server) must be installed

[`yarn`](https://www.npmjs.com/package/yarn) must be installed


  - go to the project directory (where you've cloned this repo)
  - run `yarn install`
  - run `netlify dev`
    - this will start a live dev server on port 8888 (by default)
    - port `5500` must be available or it **WILL NOT WORK**
    - if you _really need_ port `5500` for something else, replace every instance of `5500` in `netlify.toml` with your own port
    - the frontend will be hosted at `/frontend/`, but when this is deployed, it'll be in `/`
