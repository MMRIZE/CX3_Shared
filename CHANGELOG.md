# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.2.2](https://github.com/MMRIZE/CX3_Shared/compare/v1.2.1...v1.2.2) (2026-10-17)

### Fixed

* **dates:** include January in current year ([6e5917b](https://github.com/MMRIZE/CX3_Shared/commit/6e5917beea4f481f5999bf8c200e0798123cc703))
* **events:** isolate pool and normalize dates ([36e4e7d](https://github.com/MMRIZE/CX3_Shared/commit/36e4e7dfd233566486a63f90bcdea6246faf5c11))

### Performance Improvements

* **dates:** avoid duplicate formatter creation ([9d7e38e](https://github.com/MMRIZE/CX3_Shared/commit/9d7e38ebed294596b1398f4dbe2a60f1c39e68f0))
* **events:** avoid repeated array copies ([c4b41a2](https://github.com/MMRIZE/CX3_Shared/commit/c4b41a2f21ca9fdf8e64d2a8ba70727077db0631))
* **events:** cache contrast colors ([e339534](https://github.com/MMRIZE/CX3_Shared/commit/e339534d18cc09184cb6ba4d5dad4c97725f3ee6))

### Chores

* add dependabot config ([178af9f](https://github.com/MMRIZE/CX3_Shared/commit/178af9fe1c2f951a323f67f31d02d046a5aaca44))
* **iconify:** update CDN to 3.0.3 ([2c5a574](https://github.com/MMRIZE/CX3_Shared/commit/2c5a574d9c2ac16cf50dcabc25f6349a99a4b336))
* update devDependencies ([a82bff6](https://github.com/MMRIZE/CX3_Shared/commit/a82bff63ee40c27e5b63a047a048881c1eb5bf2c))
* update GitHub Actions ([fa6f515](https://github.com/MMRIZE/CX3_Shared/commit/fa6f515c69f6a29f74ace883f55db79bad46dc9e))

### Code Refactoring

* add stylistic ESLint rules and apply them ([3929552](https://github.com/MMRIZE/CX3_Shared/commit/3929552f53ac95ac1e6dfbc36ffcf5d5b15da1d7))
* change var to const ([9396795](https://github.com/MMRIZE/CX3_Shared/commit/93967951e4115a4349e687a3fc8bc7ffeaf51c53))
* switch ESM files to .js ([8d23b41](https://github.com/MMRIZE/CX3_Shared/commit/8d23b417e5eb98692892faaaf09125c57bfe623b))

### Tests

* **events:** fix range filtering coverage ([b94040a](https://github.com/MMRIZE/CX3_Shared/commit/b94040a4babaf47d47956f75095b8feea801a317))
* **iconify:** use static shared imports ([14eef4a](https://github.com/MMRIZE/CX3_Shared/commit/14eef4ad94348cc39a3008e96cf06249d566d4da))

## [1.2.1](https://github.com/MMRIZE/CX3_Shared/compare/v1.2.0...v1.2.1) (2026-07-06)


### Fixed

* correct ISO week numbering at year boundary ([341e44f](https://github.com/MMRIZE/CX3_Shared/commit/341e44f3be61ad9e7a226d1b75979552d82db8e5))


### Chores

* update devDependencies ([3e117f4](https://github.com/MMRIZE/CX3_Shared/commit/3e117f48029a602feb5877f62d0510aa6bcf8a21))
* update test and lint commands ([e93126e](https://github.com/MMRIZE/CX3_Shared/commit/e93126e849bf5c9c18b229dd87f7ad968266f2f0))

## [1.2.0](https://github.com/MMRIZE/CX3_Shared/compare/v1.1.1...v1.2.0) (2026-04-06)


### Added

* normalize event text fields and show date range for multiday events ([#20](https://github.com/MMRIZE/CX3_Shared/issues/20)) ([cfebb64](https://github.com/MMRIZE/CX3_Shared/commit/cfebb64c76680ee979d81effae8e881f8f041906))


### Chores

* update devDependencies ([b393618](https://github.com/MMRIZE/CX3_Shared/commit/b39361867a81c5fe6ae7481909f5f67f5206627f))

## [1.1.1](https://github.com/MMRIZE/CX3_Shared/compare/v1.1.0...v1.1.1) (2026-02-14)


### Code Refactoring

* **shared:** modernize addEventsToPool cloning ([c7e9abd](https://github.com/MMRIZE/CX3_Shared/commit/c7e9abd17bf9f1deacf1839ced2d08969f333ea6))


### Tests

* make timezone tests work in any timezone environment ([ed204b4](https://github.com/MMRIZE/CX3_Shared/commit/ed204b4c92de226df1e52d1ce958cbd803eaebda))

## 1.1.0 (2026-01-26)


### Added

* add support for alternative iconify pattern with double dash ([ef59e91](https://github.com/MMRIZE/CX3_Shared/commit/ef59e913168b6ffc160406fef7f83fb173c4a64c)), closes [#15](https://github.com/MMRIZE/CX3_Shared/issues/15)


### Fixed

* handle parameterized iCal properties to prevent [object Object] display ([0e92a5b](https://github.com/MMRIZE/CX3_Shared/commit/0e92a5b7d877395f6a3accaa420c251cb104e90c))
* use local date comparison for event.today flag ([e3fd4ed](https://github.com/MMRIZE/CX3_Shared/commit/e3fd4edd400e2065b31af64bc3196ef326070da9)), closes [#19](https://github.com/MMRIZE/CX3_Shared/issues/19)


### Chores

* add changelog configuration and script ([e0fb10a](https://github.com/MMRIZE/CX3_Shared/commit/e0fb10a5de0deae71a9f1157c4f4a38bd2c000cf))
* add ESLint configuration file ([1eddaab](https://github.com/MMRIZE/CX3_Shared/commit/1eddaabf55024c08e8267b829739b65c03334ddd))
* add test setup ([9d175a6](https://github.com/MMRIZE/CX3_Shared/commit/9d175a6ed252dcf3b723a7e1b910543cfced90e1))
* release 1.0.6 ([f95f2ad](https://github.com/MMRIZE/CX3_Shared/commit/f95f2ad364a3a1189ca921994debecef83773258))
* release 1.0.7 ([6faf1af](https://github.com/MMRIZE/CX3_Shared/commit/6faf1af7873ea87efa626b0159f2543cdcb6eaca))
* switch License file to markdown ([91b36f2](https://github.com/MMRIZE/CX3_Shared/commit/91b36f2e1b9b9486f05466a4b6ce4ad030365f95))
* update devDependencies ([2df1321](https://github.com/MMRIZE/CX3_Shared/commit/2df1321b15e34f857ebce755f2588261965f976f))
* update devDependencies ([12f8bf9](https://github.com/MMRIZE/CX3_Shared/commit/12f8bf9cb9de0666f6d929fa250e41eed16ae1b8))
* update devDependencies ([dfb7e2e](https://github.com/MMRIZE/CX3_Shared/commit/dfb7e2e5a81dea7728d558419a03523fa605abf2))
* update devDependencies ([49a4e8b](https://github.com/MMRIZE/CX3_Shared/commit/49a4e8b6ebb142729ef7ad171677ff95f63ca4f8))
* update test and lint scripts in package.json ([04e7da8](https://github.com/MMRIZE/CX3_Shared/commit/04e7da8e8d0281011efd2fdb41896796711ad62d))


### Code Refactoring

* break down preProcessor part and add comments for better comprehensibility ([a707d17](https://github.com/MMRIZE/CX3_Shared/commit/a707d176d63ed0eab08ec9d07f8fa32bbd2a4ea0))
* replace let with const for better variable scoping ([35a1617](https://github.com/MMRIZE/CX3_Shared/commit/35a16177ab115c2acf1a9ce57e72017c83764581))
