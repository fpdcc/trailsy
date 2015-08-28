Trailsy
=======

This version of Trailsy is a Code for Boulder project that uses [OuterSpatial](http://outerspatial.com) API calls to
retrieve OpenTrails data. 

It has been forked from the original Code for America 2013 Trailsy project found [here](https://github.com/codeforamerica/trailsy).

#### Credits

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

# Caveats
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


## Contributing
In the spirit of [free software][free-sw], **everyone** is encouraged to help
improve this project. 

[free-sw]: http://www.fsf.org/licensing/essays/free-sw.html

Here are some ways *you* can contribute:

* by reporting bugs
* by suggesting new features
* by translating to a new language
* by writing or editing documentation
* by writing specifications
* by writing code (**no patch is too small**: fix typos, add comments, clean up
  inconsistent whitespace)
* by refactoring code
* by closing [issues](https://github.com/CodeForBoulder/trailsy/issues)
* by reviewing patches
* [financially](https://secure.codeforamerica.org/page/contribute/default?source_codes=footer-donate-link/)

## Submitting an Issue
Please note that this application is still an in-development prototype. 

We use the GitHub issue tracker to track bugs and features. Before
submitting a bug report or feature request, check to make sure it hasn't
already been submitted. You can indicate support for an existing issue by
voting it up. When submitting a bug report, please include any details that might 
be necessary to reproduce the bug.

## Submitting a Pull Request
1. Fork the project.
2. Create a topic branch.
3. Implement your feature or bug fix.
4. Commit and push your changes.
5. Submit a pull request.

## Copyright
This fork complies with the same copyright notice as derived from the original project. 
This project does not use Code for America and its contributors to promote or endorse other products.

## Licensing
This project is licensed under a BSD 3-clause license, which can be found [here](./License.md)
