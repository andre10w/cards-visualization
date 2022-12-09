# Digital Things Carousel Visualization

## Installation and initial setup

### Install Node.js

It is recommended to use [nvm](https://github.com/nvm-sh/nvm) in order to install Node.js.

```bash
$ touch ~/.bashrc
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
$ source ~/.bashrc
$ nvm install
```

In case you should use different versions of Node.js, be sure to use the version specified in `.nvmrc` while developing:

```bash
$ nvm use
```

### Install all dependencies

Execute the following command in the root of this repository in order to
install all dependencies for all packages.

```bash
$ npm install
```

## Starting the application

Start the application with the following command.

```bash
$ npm start
```

The applications will become accessible at http://0.0.0.0:1234.

## Notes

### Clearing Parcel cache

In some siutations, the Parcel module bundler's cache prevents building the application. In this case, delete the `.parcel-cache` directory and start over.

```bash
$ rm -rf .parcel-cache
```

# Copyright

Copyright &copy; 2022 Layair GmbH

Copyright &copy; 2022 Layair LLC
