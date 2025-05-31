#!/bin/bash
set -eo pipefail

if [ "$MYSQL_USER" ] && [ "$MYSQL_PASSWORD" ]; then
  args=("-u$MYSQL_USER" "-p$MYSQL_PASSWORD")
else
  args=("-uroot" "-p$MYSQL_ROOT_PASSWORD")
fi

if mysqladmin ping -h localhost "${args[@]}" --silent; then
  exit 0
fi

exit 1
