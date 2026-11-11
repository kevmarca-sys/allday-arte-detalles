#!/bin/bash
# =====================================================================
#  ALL DAY Arte – Detalles · Arranque de cada servidor de la API (EC2)
#  Lo ejecuta automáticamente cada instancia que crea el Auto Scaling
#  Group. Instala Java 17, descarga la API desde S3 y lee los secretos
#  desde SSM Parameter Store: aquí no hay contraseñas escritas.
#  desplegar.sh reemplaza __BUCKET__ y __REGION__ antes de usarlo.
# =====================================================================
set -euxo pipefail
BUCKET="__BUCKET__"
REGION="__REGION__"

dnf install -y java-17-amazon-corretto-headless

# 1) Descargar la API (capa de lógica de negocio)
mkdir -p /opt/allday
aws s3 cp "s3://$BUCKET/app/allday-api.jar" /opt/allday/allday-api.jar --region "$REGION"

# 2) Configuración segura desde Parameter Store (cifrada con KMS)
p() { aws ssm get-parameter --name "$1" --with-decryption --query Parameter.Value --output text --region "$REGION"; }
cat > /opt/allday/allday.env <<ENV
DB_URL=$(p /allday/DB_URL)
DB_USER=$(p /allday/DB_USER)
DB_PASSWORD=$(p /allday/DB_PASSWORD)
JWT_SECRET=$(p /allday/JWT_SECRET)
ADMIN_PASSWORD=$(p /allday/ADMIN_PASSWORD)
CORS_ORIGINS=$(p /allday/CORS_ORIGINS)
PORT=8080
ENV

# 3) La API corre como servicio con un usuario sin privilegios y se reinicia sola si falla
useradd -r -s /sbin/nologin allday || true
chown -R allday:allday /opt/allday
chmod 600 /opt/allday/allday.env
cat > /etc/systemd/system/allday.service <<'SVC'
[Unit]
Description=ALL DAY API (Spring Boot)
After=network-online.target
Wants=network-online.target
[Service]
User=allday
EnvironmentFile=/opt/allday/allday.env
ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /opt/allday/allday-api.jar
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload
systemctl enable --now allday
