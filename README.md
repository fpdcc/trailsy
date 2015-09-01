![alt text](https://github.com/CodeForBoulder/trailsy/blob/master/img/logo-bc.png "Trailsy")

This version of Trailsy is a Code for Boulder project that uses [OuterSpatial](http://outerspatial.com) API calls to
retrieve OpenTrails data published by [Boulder County Parks and Open Space](http://www.bouldercounty.org/dept/openspace/pages/default.aspx). 

It has been forked from the original Code for America 2013 Trailsy project found [here](https://github.com/codeforamerica/trailsy).

In a nutshell it is a pure client side JavaScript browser app to show the trails in and around Boulder, Colorado based on data from our parks and open space.

**Q:** _What is OpenTrails data?_

**A:** OpenTrails data is a data specification that can be used to build apps to help people know about trails. 

The goal is to allow public agencies around the United States to publish their data in the same way so apps can be developed for the public to use to explore trails.
Much much more may be found at the [OpenTrail Data Website](http://www.opentraildata.org/)

## Getting Involved
---
### Use it!
* Please try the application at http://52.25.183.113 and send us feedback via [issues](https://github.com/CodeForBoulder/trailsy/issues).
 
### Get Familiar with what we're doing
* Peruse the OpenTrails working draft specification at https://docs.google.com/document/d/1KF8KAio-SqGHhh9oFY_KjfwIi3PePOHg7KfTSPh27fc/edit
* Check out the Trello Board https://trello.com/b/qzDMDsVJ/trails

## Ways *you* can contribute!
---
### Project Management
* Helping to prioritize features and issues by coordinating between Boulder County Parks and Open Space and Trailhead Labs, the producer of OuterSpatial

### Software Development
* Fork this repo's master branch
* Pick up a work item from the "To Do" column of the trello board and place it in the "Doing" column and make a comment that you're working on it.
* Do your best to use some TDD sweetness for the work item you implement, once you're convinced you're done commit and push to your repo and submit a pull request

### Data Detective
* Examine the data produced by OuterSpatial to discover what relationships exist within. 

### Specification
* Contribute your thoughts to the OpenTrails specification

### Financially
* [financially](https://secure.codeforamerica.org/page/contribute/default?source_codes=footer-donate-link/)



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

* Test files can be found in the `spec` directory
* Testing is done with [jasmine](http://jasmine.github.io/)
* Execute tests by running the command `jasmine` at the prompt, use npm to install it if you get a `command not found` error

### Running

* Executing `npm start` at the command prompt will launch a development server
* You may now access your local version of the Trailsy app at `http://localhost:8080`

### Debugging

To debug your local version of Trailsy in your browser's console and step through the individual javascript
files that are packaged together into 'bundle.js', do the following:

* Stop your local version of the Trailsy app (e.g. use `Ctrl-C` at the command prompt)
* Execute `npm run-script sourcemap`
* Start your local version of Trailsy just as in the above 'Running' section

## Caveats
Since the conversion to using OpenTrails is a WIP, expect some functionality to be missing.

## Deployment

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


#### Acknowledgements
This project would not be possible without the support of the Boulder County Parks and Open Space department and Trailhead Labs. *Thank you!*
 
#### Credits
---
The team includes
* [Mario Barrenechea][mbarrenecheajr], developer
* [Robert Soden][rsoden], developer
* [Sean Garborg][garborg], developer
* [James Gould][JamesGould123], developer
* [Trevor Ackerman][trevorackerman], developer
* You, if you're interested in volunteering!

[mbarrenecheajr]: https://github.com/mbarrenecheajr
[rsoden]: https://github.com/rsoden
[garborg]: https://github.com/garborg
[JamesGould123]: https://github.com/JamesGould123
[trevorackerman]: https://github.com/trevorackerman

You can contact us here if you would like to get involved.
