# Sunrays ☀️

Sunrays is a back-end oriented Javascript framework for building better and faster business applications, intended to be used with the [Sunflowers🌻 Front-End Javascript library](https://github.com/lenacassandre/sunflowers) for an optimal experience.

Hello!

This repository contains the Sunrays source code, along with an example project in the `example` folder. The libraries are works in progress, thanks for hanging out while we figure things out and prepare our proper first release!

## Features

The aim is to create a library which will make creating back-ends a much more easier and pleasurable experience.

Features:
  - Plug 'n play socket.io integration which allows for instant refresh on all instances of the application.
  - Facilitated management of user roles, .
  - Easier creation of entities, with automatically generated CRUD routes.
  - Built-in management of sale points/organisation locations.
  - Performance focused database queries depending on the user's role[s] and authorized access.

## Documentation

Currently being worked on.

## Using the library

  - Download or clone the [source-code example folder](https://github.com/lenacassandre/sunrays/example) and rename it how you feel like naming it :)
  - Declare a `SECRET` variable in a `.env` file at the root folder of your project
  - Run `yarn install`
  - Run `yarn watch`
  - You're set! Why not get your hands on the concepts of the library and practice by reading our [getting started guide?](https://github.com/lenacassandre/sunrays/docs/gettingstarted/md)


## Contributing

  - yarn commit (= git add . && git commit)
  - yarn release (= bump relese && git push)