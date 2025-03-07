FROM python:3.10-slim

ENV PYTHONBUFFERED 1
ENV PYTHONPATH=/questin/
ENV HF_ENDPOINT=https://hf-mirror.com

RUN apt-get update && \
    apt-get install -y gcc && \
    apt-get install -y nginx && \
    apt-get install -y ffmpeg libsm6 libxext6 && rm -rf /var/lib/apt/lists/*

WORKDIR /questin

COPY . /questin

RUN pip install --no-cache-dir -r requirements.txt

COPY ./entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["sh", "-c", "sed -i 's/\\r$//' ./entrypoint.sh && /bin/bash ./entrypoint.sh"]
