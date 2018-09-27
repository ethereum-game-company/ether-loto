# Ether Loto

This is an Ethereum based lotery written in Solidity.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

**This public repository contains only the DApp for the Lottery.**

_To have access to the contract code you have to be a contributor_ and this is not open to discussion yet!

### Prerequisites

You must have _npm_ and _bower_ installed.

### Installing

Clone this repository to your computer and go to its folder.

```bash
git clone https://github.com/ethereum-game-company/ether-loto.git
cd ether-loto
```

Install project dependencies

```bash
npm i
```

### Running

We're using gulp to load and minify the needed files.

You also have to update the [web/src/js/1_contract_address.js](web/src/js/1_contract_address.js) to point to a valid running contract on Ropsten or Rinkeby testnet.

```bash
npm start
```

## Running the tests

We still have to create the tests!

### Test coverage

To be written!

## Deployment

In this phase the project must not be deployed neither on the Mainnet nor on Testnets. It is intended to be tested until we have the main contract up and running.

To get a ready to deploy package just run:

```bash
npm run deploy
```

And publish all the files on ```.\web\build\**\*```.

## Built With

* [Web3](https://github.com/ethereum/web3.js)
* [Gulp](https://gulpjs.com)
* [jQuery](https://jquery.com/)
* [npm](https://www.npmjs.com/)
* [Bower](https://bower.io/)
* [Bootstrap](https://getbootstrap.com/)

## Contributing

Please read [CONTRIBUTING.md](https://github.com/ngoline/ether-loto/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/ngoline/ether-loto/tags).

## Authors

* **Níckolas Goline** - *Initial work* - [nGoline](https://github.com/ngoline)

See also the list of [contributors](https://github.com/ngoline/ether-loto/contributors) who participated in this project.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

None yet...