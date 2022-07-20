
# Goals

docker-compose.sh is assisting script which main functions are:

- provide two basic methods for running and stopping formation of containers
- import all parameters needed for configurying containers from .env file
- validate as much as it is reasonable presence of individual env vars in .env file
- provide additional information about how to connect to each component of containers formation
- create automatically kafka topics based on KAFKA_CREATE_TOPICS
- create automatically mysql database given by name by MYSQL_DB env var with encoding provided with MYSQL_DEFAULT_CHARACTER_SET env var
- set mysql privileges for connectivity as root from local dev machine

# Usage

just copy file file .env.example under name .env

```

cp .env.example .env

```

.. then set env vars as needed in .env file.

Then simply run containers using:

```

/bin/bash docker-compose.sh up

```

and you can stop containers using:

```

/bin/bash docker-compose.sh down

```

# Issues:

If you will have any issues with enything it's worth considering removing docker/persistence directory with all states for all containers and starting from scratch

# Further research

- [Found after I finished building this setup](https://developer.confluent.io/quickstart/kafka-docker/)
