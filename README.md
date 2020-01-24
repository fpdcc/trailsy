Trailsy
=======

Trailsy is the front-end component for the Forest Preserves of Cook County (FPCC) Mapping Application developed by FPCC and Smart Chicago Collaborative. It has been forked from the original Code for America 2013 Trailsy project found [here](https://github.com/codeforamerica/trailsy). It also borrows heavily from the [Code for Boulder fork of Trailsy](https://github.com/codeforboulder/trailsy).

In a nutshell it is a pure client side JavaScript browser app to show the trails, amenities, and activities in the FPCC.

**Q:** _What is OpenTrails data?_

**A:** OpenTrails data is a data specification that can be used to build apps to help people know about trails. 

The goal is to allow public agencies around the United States to publish their data in the same way so apps can be developed for the public to use to explore trails.

The FPCC version of Trailsy has deviated significantly from the current Trailsy specification. "Trailheads" have been transformed into Points of Interest (POI). In most cases the POI location represents the entrance to the POI area. Two additional point layers, Activities and Picnic Groves, have been added. These points "belong" to a POI and provide specific amenity location.


## Getting Involved
---
### Use it!
* Please try the application at https://map.fpdcc.com/ and send us feedback via [issues](https://github.com/smartchicago/trailsy/issues).

### Download our data
* All the Forest Preserves data used in this map is available here: https://github.com/fpdcc/webmap_data_updates
 
### Get Familiar with the OpenTrails specification
* Peruse the OpenTrails working draft specification at https://docs.google.com/document/d/1KF8KAio-SqGHhh9oFY_KjfwIi3PePOHg7KfTSPh27fc/edit

## Ways *you* can contribute!
---
### Specification
* Contribute your thoughts to the OpenTrails specification

## Software Development How-To
---

## Setup
This project depends on Node.js (for dependency management, the build step, and a dev server), which we will assume 
you've installed either from a binary [here](https://nodejs.org/download/) or using your favorite package manager.

All remaining instructions assume you have:
* Cloned this repo
* Opend a Terminal or other command line utility
* Changed the current directory to this repo

### Building

* Executing `npm install` at the command prompt will install dependencies and make trails ready to run

### Testing

## Contributing
In the spirit of [free software][free-sw], **everyone** is encouraged to help
improve this project.
* Test files can be found in the `spec` directory
* Testing is done with [jasmine](http://jasmine.github.io/)
* Execute tests by running the command `jasmine` at the prompt, use npm to install it if you get a `command not found` error

### Running

* Executing `npm start` at the command prompt will launch a development server
* You may now access your local version of the Trailsy app at `http://localhost:9000`

### Debugging

To debug your local version of Trailsy in your browser's console and step through the individual javascript
files that are packaged together into 'bundle.js', do the following:

* Stop your local version of the Trailsy app (e.g. use `Ctrl-C` at the command prompt)
* Execute `npm run-script sourcemap`
* Start your local version of Trailsy just as in the above 'Running' section

## Creating a Distribution for running as a pure static site
* cd to the project directory and run the following commands
* `rm bundle.js bundle.js.map`
* `webpack`
* `mkdir dist`
* `cp index.html dist`
* `cp error.html dist`
* `cp bundle.js dist`
* `cp bundle.js.map dist`
* `cp -r styles dist`
* `cp -r img dist`
* `mkdir dist/node_modules`
* `cp -r node_modules/bootstrap-drawer dist/node_modules`

Please note that this application is still an in-development prototype.

We use the [GitHub issue tracker][issues] to track bugs and features. Before
submitting a bug report or feature request, check to make sure it hasn't
already been submitted. You can indicate support for an existing issue by
voting it up. When submitting a bug report, please include any details that might
be necessary to reproduce the bug.
## Deployment via webpack server

[webpacksite]:(http://webpack.github.io/docs/webpack-dev-server.html)
With RHEL / CentOS / Fedora

Switch to the root user
(e.g. On an AWS instance after you log in execute `sudo su -`)

Install git via yum
Clone this repository

Add the '--host [IP Address]' option into the 'start' line within the package.json file so trailsy is accessible
outside of localhost. 

* [Webpack Server][webpacksite], documentation for webpack server

Install NodeJS and npm via the instructions here:
https://github.com/joyent/node/wiki/installing-node.js-via-package-manager

Once NodeJS and npm are installed follow instructions from Building and then Running.

---
### Contributing
In the spirit of [free software][free-sw], **everyone** is encouraged to help
improve this project. 

[free-sw]: http://www.fsf.org/licensing/essays/free-sw.html

### Copyright
This fork complies with the same copyright notice as derived from the original project. 
This project does not use Code for America and its contributors to promote or endorse other products.

### Licensing
This project is licensed under a BSD 3-clause license, which can be found [here](./License.md)
