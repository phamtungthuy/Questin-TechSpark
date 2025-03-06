<div align="center">
<a href="https://chatuet.id.vn/">
<img src="frontend/src/assets/questin.png" width="320" alt="questin logo">
</a>
</div>

<p align="center" >
  <a href="./README.md">English</a> |
  <a href="./README_vi.md">Vietnamese</a>
</p>

<details open>
<summary><b>📕 Table of Contents</b></summary>

- 🎮 [Demo](#-demo)
- 🔎 [System Architecture](#-system-architecture)
- 🎬 [Get Started](#-get-started)
- 🔧 [Configurations](#-configurations)

</details>



## 🎮 Demo

Try our demo at [https://chatuet.id.vn](https://chatuet.id.vn).

## 🔎 System Architecture

## 🎬 Get Started

### 📝 Prerequisites

- CPU >= 4 cores
- RAM >= 16 GB
- Disk >= 50 GB
- Docker >= 24.0.0 & Docker Compose >= v2.26.1
  > If you have not installed Docker on your local machine (Windows, Mac, or Linux),
  > see [Install Docker Engine](https://docs.docker.com/engine/install/).

### 🚀 Start up the server

1. Clone the repo:

   ```bash
   $ git clone https://github.com/phamtungthuy/Questin-TechSpark.git
   ```

3. Start up the server using the pre-built Docker images:

   > The command below downloads the latest edition of the Questin Docker image.To download a Questin edition different from the latest, update the `QUESTIN_IMAGE` variable accordingly in **docker/.env** before using `docker compose` to start the server. For example: set `QUESTIN_IMAGE=phamtungthuy/questin:0.1` for the latest edition.
   ```bash
   $ docker compose -f docker-compose-gpu.yml up -d
   ```

   > The command below will build a Docker image in local.
   ```bash
   $ docker compose up -d
   ```

4. Check the server status after having the server up and running:

   ```bash
   $ docker logs -f questin
   ```

   _The following output confirms a successful launch of the system:_

   ```bash

       ___  _   _ _____ ____ _____ ___ _   _ 
      / _ \| | | | ____/ ___|_   _|_ _| \ | |
     | | | | | | |  _| \___ \ | |  | ||  \| |
     | |_| | |_| | |___ ___) || |  | || |\  |
      \__\_\\___/|_____|____/ |_| |___|_| \_  

   ```

5. In your web browser, enter the IP address of your server and log in to Questin.
   > With the default settings, you only need to enter `http://IP_OF_YOUR_MACHINE` (**sans** port number) as the default
   > HTTP serving port `3000` can be omitted when using the default configurations.
6. In folder fastapi/service_conf.yaml, copy [service_conf-sample.yaml](./fastapi/conf/service_conf-sample.yaml) to service_conf.yaml. After that, in serrvice_conf.yaml, select the desired LLM factory in `user_default_llm` and update
   the `API_KEY` field with the corresponding API key.

   _The show is on!_

## 🔧 Configurations

When it comes to system configurations, you will need to manage the following files:

- [.env](./.env): Keeps the fundamental setups for the system, such as `QUESTIN_SERVER_PORT`, `ELASTIC_PASSWORD`, `MYSQL_PASSWORD`, 
  `MINIO_PASSWORD`, v.v.
- [service_conf-sample.yaml](./fastapi/conf/service_conf-sample.yaml): Configures the back-end services. The environment variables in this file will be automatically populated when the Docker container starts. Any environment variables set within the Docker container will be available for use, allowing you to customize service behavior based on the deployment environment.
- [docker-compose.yml](./docker-compose.yml): The system relies on [docker-compose.yml](./docker-compose.yml) to start up.

Updates to the above configurations require a reboot of all containers to take effect:

> ```bash
> $ docker compose -f docker-compose.yml up -d
> ```
