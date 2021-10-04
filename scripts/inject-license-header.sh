#!/bin/bash
set -ex
DIRNAME=`dirname $0`

for i in $(find $DIRNAME/../src -name '*.ts')
do
  if ! grep -q Copyright $i
  then
    cat ./scripts/LICENSE_HEADER $i >$i.new && mv $i.new $i
  fi
done