## Project X: A backend template based on Node

#### Third Party Library Usage:
* Typescript
* Express
* TypeORM
* Log4js
#### Basic environments:

* node: v12.16.2 +
* yarn: 1.22.5 (not necessary)
* tmux: 3.1b (not necessary)

#### Pre-working:

```zsh
$ cd /path/to/the/project/
$ yarn #(recommend)
$ # or
$ npm install
```

then run script `dev.sh` if tmux installed to your computer.

```zsh
$ ./dev.sh
```

or use command below to compile TS files to JS files:

```zsh
$ ./node_modules/typescript/bin/tsc -w -p ./
```

#### Launch app:
```zsh
$ ./run.sh dev # running as dev mode, hot-reload function is activated
$ ./run.sh # running as application default
$ ./run.sh -p[--port] PORT # specify a port to replace application default
```
#### Run scripts:

```zsh
$ ./node_modules/nodemon/bin/nodemon.js -r source-map-support/register ./app/scripts/async-tasks.js # as dev mode
$ node ./app/scripts/async-tasks.js # as app default
```
#### Sess logs:
using command below to see logs. you can also manually check logs in ./logs directory.
```zsh
$ ./log.sh
```