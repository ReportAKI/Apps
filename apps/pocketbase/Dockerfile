FROM alpine:latest

ARG PB_VERSION=0.23.0

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download PocketBase Linux binary
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Αντιγραφή της τοπικής βάσης δεδομένων μέσα στο container
COPY ./pb_data /pb/pb_data

EXPOSE 8080

# Run PocketBase
CMD /pb/pocketbase superuser upsert reportaki.support@gmail.com reportaki2026 && /pb/pocketbase serve --http=0.0.0.0:8080 --dir=/pb/pb_data