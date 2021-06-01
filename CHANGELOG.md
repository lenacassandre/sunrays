# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.4.7](https://github.com/lenacassandre/sunrays/compare/v0.4.6...v0.4.7) (2021-06-01)


### Bug Fixes

* post ([3431178](https://github.com/lenacassandre/sunrays/commit/3431178683144d790d5b60a6e85573a84411814d))

### [0.4.6](https://github.com/lenacassandre/sunrays/compare/v0.4.5...v0.4.6) (2021-06-01)


### Bug Fixes

* **post:** allow orga post for superadmins ([a49dd13](https://github.com/lenacassandre/sunrays/commit/a49dd13fa3866dd77b503556d2a08c7a17194743))

### [0.4.5](https://github.com/lenacassandre/sunrays/compare/v0.4.4...v0.4.5) (2021-05-31)


### Bug Fixes

* **repo controllers/superadmin:** removed hard coded permission for superadmins ([691818a](https://github.com/lenacassandre/sunrays/commit/691818a1fdc5a82a68e0d66baf5149b0397d702e))

### [0.4.4](https://github.com/lenacassandre/sunrays/compare/v0.4.3...v0.4.4) (2021-05-26)


### Features

* getUserFromToken & getTokenFromUser ([374d11d](https://github.com/lenacassandre/sunrays/commit/374d11d47db36fc71d55ad7e8f8664bb34f49651))

### [0.4.3](https://github.com/lenacassandre/sunrays/compare/v0.4.2...v0.4.3) (2021-05-26)


### Bug Fixes

* hTTP token is passed in header ([1c2fe94](https://github.com/lenacassandre/sunrays/commit/1c2fe94b498e8e495eaf938211cc4ea5aac15286))

### [0.4.2](https://github.com/lenacassandre/sunrays/compare/v0.4.1...v0.4.2) (2021-05-25)


### Features

* **http:** added file prop to the request object ([810b6e3](https://github.com/lenacassandre/sunrays/commit/810b6e3fb529926662552e5b72b4c50419f3b386))

### [0.4.1](https://github.com/lenacassandre/sunrays/compare/v0.4.0...v0.4.1) (2021-05-24)


### Bug Fixes

* **http:** fixed request files type ([745c5aa](https://github.com/lenacassandre/sunrays/commit/745c5aa3a91ff6ada971f6de6419838b53bd09bc))

## [0.4.0](https://github.com/lenacassandre/sunrays/compare/v0.3.2...v0.4.0) (2021-05-24)


### ⚠ BREAKING CHANGES

* **passed files in req:** req.data => req.body

### Features

* **passed files in req:** passing HTTP files in req ([51c5f14](https://github.com/lenacassandre/sunrays/commit/51c5f1453e5869a59f9afccf2502f80490499d42))

### [0.3.2](https://github.com/lenacassandre/sunrays/compare/v0.3.1...v0.3.2) (2021-05-21)

### [0.3.1](https://github.com/lenacassandre/sunrays/compare/v0.3.0...v0.3.1) (2021-05-21)


### Bug Fixes

* **http routes:** fixed logs and body parsing ([22c6ed8](https://github.com/lenacassandre/sunrays/commit/22c6ed80a4bdfcbca5dce36078a6187bddc9eefc))

## [0.3.0](https://github.com/lenacassandre/sunrays/compare/v0.2.5...v0.3.0) (2021-05-20)


### ⚠ BREAKING CHANGES

* **http routes:** Permissions functions's arguments order is changed.

### Features

* **http routes:** the server is automatically listening to all routes/controllers with HTTP ([8e1c2ef](https://github.com/lenacassandre/sunrays/commit/8e1c2ef6c0ac4e2fb93f32fe0bb2079d32939c53))

### [0.2.5](https://github.com/lenacassandre/sunrays/compare/v0.2.4...v0.2.5) (2021-05-12)


### Features

* **dispatchchanges:** dispatchChanges on every controllers exept destroy ([dc738e1](https://github.com/lenacassandre/sunrays/commit/dc738e163a247b22c1bc02283c7643b282a0582d))

### [0.2.4](https://github.com/lenacassandre/sunrays/compare/v0.2.3...v0.2.4) (2021-05-11)


### Bug Fixes

* **getall x user:** getAll, getArchives & getRemoved no longer send password hash ([07a2680](https://github.com/lenacassandre/sunrays/commit/07a268079600ea2868c268dbeada4c436b936a9c))

### [0.2.3](https://github.com/lenacassandre/sunrays/compare/v0.2.2...v0.2.3) (2021-05-07)


### Bug Fixes

* **getall:** log more infos while debugging ([a57684e](https://github.com/lenacassandre/sunrays/commit/a57684ec72f05622303a281701ad70e2295de099))

### [0.2.2](https://github.com/lenacassandre/sunrays/compare/v0.2.1...v0.2.2) (2021-05-07)


### Bug Fixes

* **orga:** orga filter on conrtollres ([cda07ad](https://github.com/lenacassandre/sunrays/commit/cda07ad573f00c72a826bb31443461342de979cc))

### [0.2.1](https://github.com/lenacassandre/sunrays/compare/v0.1.0...v0.2.1) (2021-05-07)

## [0.1.0](https://github.com/lenacassandre/sunrays/compare/v0.0.17...v0.1.0) (2021-05-07)


### ⚠ BREAKING CHANGES

* **archives & organizations update:** New permission function are required with a model declaration

### Features

* **archives & organizations update:** archives and trash System. Organization, roles, superadmin ([966f8a8](https://github.com/lenacassandre/sunrays/commit/966f8a8fcbf3e63b716ed2181622f57c36fdab03))


### Bug Fixes

* **package.json:** removed koa ([7f5461e](https://github.com/lenacassandre/sunrays/commit/7f5461ef67cf2f3c5ef25b52975992cb59fbb0ff))

### [0.0.17](https://github.com/lenacassandre/sunrays/compare/v0.0.16...v0.0.17) (2021-04-14)


### Bug Fixes

* **login:** error ([8e7785b](https://github.com/lenacassandre/sunrays/commit/8e7785bbfeeb596e04d94548c2e9f643aa574b82))

### [0.0.16](https://github.com/lenacassandre/sunrays/compare/v0.0.15...v0.0.16) (2021-04-14)


### Bug Fixes

* **login:** fixed the way the error is logged ([b561101](https://github.com/lenacassandre/sunrays/commit/b561101c50163b0a23e1c96ed05c008b72ee1f10))

### [0.0.15](https://github.com/lenacassandre/sunrays/compare/v0.0.14...v0.0.15) (2021-04-14)


### Bug Fixes

* **login:** log error ([fe0f471](https://github.com/lenacassandre/sunrays/commit/fe0f47167b9d8f3f292154b04efb48841e3b6c18))

### [0.0.14](https://github.com/lenacassandre/sunrays/compare/v0.0.13...v0.0.14) (2021-04-14)


### Features

* **config parameter for automaton class:** config parameter ([b9f4bec](https://github.com/lenacassandre/sunrays/commit/b9f4bec903a2d66c942a721f87aa5da06a9da73c))

### [0.1.12](https://github.com/lenacassandre/sunrays/compare/v0.1.11...v0.1.12) (2021-04-06)


### Bug Fixes

* **cors:** cors ([b4185ad](https://github.com/lenacassandre/sunrays/commit/b4185ad4e7a7f74ddc705854e48713e62db2938a))

### [0.1.11](https://github.com/lenacassandre/sunrays/compare/v0.1.10...v0.1.11) (2021-04-06)


### Bug Fixes

* **jwt:** throw an error if process.env.SECRET is undefiend ([daedebe](https://github.com/lenacassandre/sunrays/commit/daedebe4059ee8449cc736d3b59b83389a36b34e))

### [0.1.10](https://github.com/lenacassandre/sunrays/compare/v0.1.9...v0.1.10) (2021-04-05)


### Bug Fixes

* **factorymethods:** document._id: string => mongoose.Types.ObjectId ([1c36526](https://github.com/lenacassandre/sunrays/commit/1c36526a90922cd85485b147676769b37554d90e))

### [0.1.9](https://github.com/lenacassandre/sunrays/compare/v0.1.8...v0.1.9) (2021-04-05)


### Bug Fixes

* **version:** problème de version + package.json ([79663eb](https://github.com/lenacassandre/sunrays/commit/79663eb70a76bd06a21b386b9a496271ce257147))

### [0.1.8](https://github.com/lenacassandre/sunrays/compare/v0.1.7...v0.1.8) (2021-04-05)


### Bug Fixes

* **document.class:** removed extends from mongoose document ([6b7afe2](https://github.com/lenacassandre/sunrays/commit/6b7afe25c04991b7736cc188d9e1f8b3af92ee0b))

### [0.1.7](https://github.com/lenacassandre/sunrays/compare/v0.1.6...v0.1.7) (2021-04-05)

### [0.1.6](https://github.com/lenacassandre/sunrays/compare/v0.1.5...v0.1.6) (2021-04-05)

### [0.1.5](https://github.com/lenacassandre/sunrays/compare/v0.1.4...v0.1.5) (2021-04-05)

### [0.1.4](https://github.com/lenacassandre/sunrays/compare/v0.1.3...v0.1.4) (2021-04-05)


### Bug Fixes

* **build:** rebuild ([53da1a4](https://github.com/lenacassandre/sunrays/commit/53da1a4268904302ae0308970f1f83cd01f2277e))

### 0.1.3 (2021-04-05)


### Bug Fixes

* **document.class:** extends from mongoose document. + added commit and release npm scripts ([41b2a21](https://github.com/lenacassandre/sunrays/commit/41b2a216e61e46d5793449bf47a9ccffcc8a8d66))
* extends Document from mongoose Document Class ([48a7de9](https://github.com/lenacassandre/sunrays/commit/48a7de92c8cb3d82018dc023624d6975aa0fb5d9))
