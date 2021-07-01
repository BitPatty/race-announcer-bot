SHELL := /bin/bash

NODE_VERSION="$$(node --version | sed 's/v//' | tr --delete '\n')"
NVMRC_VERSION="$$(head -1 .nvmrc | sed 's/v//' | tr --delete '\n')"

dist: node_modules package.json
	@npm run build

.ONESHELL:
node_modules: .nvmrc package-lock.json package.json
	@source ~/.bashrc
	@rm -rf dist
	@mkdir dist
	@npm i
	@touch node_modules

.ONESHELL:
all::
	@if [[ $(NODE_VERSION) == $(NVMRC_VERSION) ]]; then
	@	echo "Node Version is up to date"
	@else
	@ 	echo "Adjusting Node Version"
	@ 	echo Current Version:
	@ 	echo $(NODE_VERSION)
	@ 	echo "Configured Version:"
	@ 	echo $(NVMRC_VERSION)
	@ 	source ${NVM_DIR}/nvm.sh
	@ 	rm -rf node_modules
	@ 	mkdir node_modules
	@ 	nvm install
	@ 	nvm use
	@ 	nvm alias default $$(node --version)
	@ 	echo "Updating npm"
	@ 	nvm install-latest-npm
	@ 	touch .nvmrc
	@fi