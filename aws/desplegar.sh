#!/bin/bash
# =====================================================================
#  ALL DAY Arte – Detalles · Despliegue completo en AWS
#  Ejecutar en AWS CloudShell (ya tiene la AWS CLI con sus permisos):
#     cd /tmp && git clone https://github.com/kevmarca-sys/allday-arte-detalles.git
#     bash allday-arte-detalles/aws/desplegar.sh
#
#  Arquitectura por capas que crea:
#   Usuario ──HTTPS──> CloudFront ──> S3 (capa de presentación: React)
#                         └─ /api/* ──> ALB ──> Auto Scaling Group (2–4 EC2,
#                                              capa de lógica: Spring Boot)
#                                                  └──> RDS PostgreSQL privada
#                                                       (capa de datos)
#  Se puede volver a ejecutar: lo que ya existe se reutiliza y, si la API ya
#  estaba desplegada, se actualiza servidor por servidor sin cortar el servicio.
# =====================================================================
set -euo pipefail
export AWS_PAGER=""
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
export AWS_DEFAULT_REGION="$REGION"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
CUENTA=$(aws sts get-caller-identity --query Account --output text)
BUCKET="allday-${CUENTA}-${REGION}"
TMP=/tmp/allday-despliegue; mkdir -p "$TMP"
paso() { echo -e "\n\033[1;36m▶ $*\033[0m"; }
ok()   { echo -e "  \033[0;32m✔ $*\033[0m"; }
falla(){ echo -e "\n\033[1;31m✘ $*\033[0m"; exit 1; }
# Ejecuta un comando que puede fallar solo porque la regla ya existe
regla() { local out; out=$("$@" 2>&1) || { echo "$out" | grep -q "Duplicate" || falla "$out"; }; }

echo "Cuenta $CUENTA · región $REGION · bucket $BUCKET"

# ---------------------------------------------------------------------
paso "1/10 Contraseña del administrador (admin@allday.ec)"
param() { aws ssm get-parameter --name "$1" --with-decryption --query Parameter.Value --output text 2>/dev/null || true; }
guardar() { aws ssm put-parameter --name "$1" --type SecureString --value "$2" --overwrite >/dev/null; }
if [ -z "$(param /allday/ADMIN_PASSWORD)" ]; then
  while true; do
    read -r -s -p "  Escriba la contraseña del administrador (mínimo 8 caracteres): " A1; echo
    read -r -s -p "  Repítala: " A2; echo
    [ "$A1" = "$A2" ] && [ ${#A1} -ge 8 ] && break
    echo "  No coinciden o es muy corta. Intente de nuevo."
  done
  guardar /allday/ADMIN_PASSWORD "$A1"; unset A1 A2
  ok "Guardada cifrada en Parameter Store"
else ok "Ya estaba guardada (no se cambia)"; fi
[ -n "$(param /allday/DB_PASSWORD)" ] || guardar /allday/DB_PASSWORD "$(openssl rand -hex 16)"
[ -n "$(param /allday/JWT_SECRET)" ]  || guardar /allday/JWT_SECRET "$(openssl rand -base64 48 | tr -d '\n')"
guardar /allday/DB_USER "allday"
guardar /allday/CORS_ORIGINS "https://*.cloudfront.net"
DB_PASS=$(param /allday/DB_PASSWORD)

# ---------------------------------------------------------------------
paso "2/10 Compilando la API (Java 17 + Maven) y la web (React + Vite)"
if ! ls /usr/lib/jvm/java-17-amazon-corretto*/bin/javac >/dev/null 2>&1; then
  sudo dnf install -y -q java-17-amazon-corretto-devel >/dev/null
fi
export JAVA_HOME=$(dirname "$(dirname "$(ls /usr/lib/jvm/java-17-amazon-corretto*/bin/javac | head -1)")")
MVN=/tmp/apache-maven-3.9.9/bin/mvn
[ -x "$MVN" ] || curl -fsSL https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz | tar xz -C /tmp
(cd "$RAIZ/allday-api" && "$MVN" -q -B -DskipTests -Dmaven.repo.local=/tmp/m2 clean package)
JAR=$(ls "$RAIZ"/allday-api/target/allday-api-*.jar | grep -v original | head -1)
ok "API: $(basename "$JAR") ($(du -h "$JAR" | cut -f1))"
(cd "$RAIZ/allday-web" && npm_config_cache=/tmp/npm npm ci --no-audit --no-fund --loglevel=error && npm run build --silent)
ok "Web compilada en allday-web/dist"

# ---------------------------------------------------------------------
paso "3/10 S3: bucket privado con la API y la web"
if ! aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  if [ "$REGION" = "us-east-1" ]; then aws s3api create-bucket --bucket "$BUCKET" >/dev/null
  else aws s3api create-bucket --bucket "$BUCKET" --create-bucket-configuration LocationConstraint="$REGION" >/dev/null; fi
fi
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3 cp "$JAR" "s3://$BUCKET/app/allday-api.jar" --only-show-errors
aws s3 sync "$RAIZ/allday-web/dist/" "s3://$BUCKET/web/" --delete --exclude index.html \
  --cache-control "public,max-age=31536000,immutable" --only-show-errors
aws s3 cp "$RAIZ/allday-web/dist/index.html" "s3://$BUCKET/web/index.html" --cache-control "no-cache" --only-show-errors
ok "Archivos subidos (el bucket NO es público)"

# ---------------------------------------------------------------------
paso "4/10 Red: VPC, subredes y grupos de seguridad"
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
[ "$VPC" != "None" ] || falla "La cuenta no tiene VPC por defecto. Créela en VPC > Acciones > Crear VPC predeterminada."
# us-east-1e no tiene instancias t3; se usan las demás zonas
SUBNETS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC" Name=default-for-az,Values=true \
  --query "Subnets[?AvailabilityZone!='us-east-1e'].SubnetId" --output text)
[ "$(echo "$SUBNETS" | wc -w)" -ge 2 ] || falla "Se necesitan al menos 2 subredes en zonas distintas."
SUBNETS_COMA=$(echo "$SUBNETS" | tr '\t ' ',,')
sg() {
  local id; id=$(aws ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC" Name=group-name,Values="$1" \
    --query 'SecurityGroups[0].GroupId' --output text)
  [ "$id" != "None" ] || id=$(aws ec2 create-security-group --group-name "$1" --description "$2" --vpc-id "$VPC" --query GroupId --output text)
  echo "$id"
}
SG_ALB=$(sg allday-sg-alb "ALB - solo recibe trafico de CloudFront en el puerto 80")
SG_API=$(sg allday-sg-api "API - solo recibe trafico del ALB en el puerto 8080")
SG_DB=$(sg allday-sg-db "RDS - solo recibe conexiones de la API en el puerto 5432")
PL_CF=$(aws ec2 describe-managed-prefix-lists --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing \
  --query 'PrefixLists[0].PrefixListId' --output text)
regla aws ec2 authorize-security-group-ingress --group-id "$SG_ALB" --ip-permissions "IpProtocol=tcp,FromPort=80,ToPort=80,PrefixListIds=[{PrefixListId=$PL_CF,Description=CloudFront}]"
regla aws ec2 authorize-security-group-ingress --group-id "$SG_API" --ip-permissions "IpProtocol=tcp,FromPort=8080,ToPort=8080,UserIdGroupPairs=[{GroupId=$SG_ALB,Description=ALB}]"
regla aws ec2 authorize-security-group-ingress --group-id "$SG_DB"  --ip-permissions "IpProtocol=tcp,FromPort=5432,ToPort=5432,UserIdGroupPairs=[{GroupId=$SG_API,Description=API}]"
ok "sg-alb $SG_ALB · sg-api $SG_API · sg-db $SG_DB"

# ---------------------------------------------------------------------
paso "5/10 RDS PostgreSQL privada (capa de datos)"
aws rds describe-db-subnet-groups --db-subnet-group-name allday-db-subnets >/dev/null 2>&1 || \
  aws rds create-db-subnet-group --db-subnet-group-name allday-db-subnets \
    --db-subnet-group-description "Subredes de la base de ALL DAY" --subnet-ids $SUBNETS >/dev/null
if ! aws rds describe-db-instances --db-instance-identifier allday-db >/dev/null 2>&1; then
  crear_db() {
    aws rds create-db-instance --db-instance-identifier allday-db --engine postgres \
      --db-instance-class db.t3.micro --allocated-storage 20 --storage-type gp2 --storage-encrypted \
      --master-username allday --master-user-password "$DB_PASS" --db-name allday \
      --vpc-security-group-ids "$SG_DB" --db-subnet-group-name allday-db-subnets \
      --no-publicly-accessible --no-multi-az --backup-retention-period "$1" >/dev/null
  }
  # Las cuentas del plan gratuito pueden limitar las copias automáticas
  crear_db 1 2>/dev/null || crear_db 0
  ok "Base creándose (tarda unos 5-10 minutos; seguimos con lo demás)"
else ok "La base ya existía"; fi

# ---------------------------------------------------------------------
paso "6/10 IAM: rol de mínimo privilegio para los servidores"
ROL=allday-ec2-role
aws iam get-role --role-name $ROL >/dev/null 2>&1 || aws iam create-role --role-name $ROL \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
aws iam attach-role-policy --role-name $ROL --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam put-role-policy --role-name $ROL --policy-name allday-minimo --policy-document "{
  \"Version\":\"2012-10-17\",\"Statement\":[
   {\"Effect\":\"Allow\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::$BUCKET/app/*\"},
   {\"Effect\":\"Allow\",\"Action\":[\"ssm:GetParameter\",\"ssm:GetParameters\"],\"Resource\":\"arn:aws:ssm:$REGION:$CUENTA:parameter/allday/*\"}]}"
if ! aws iam get-instance-profile --instance-profile-name $ROL >/dev/null 2>&1; then
  aws iam create-instance-profile --instance-profile-name $ROL >/dev/null
  aws iam add-role-to-instance-profile --instance-profile-name $ROL --role-name $ROL
  sleep 15   # IAM tarda unos segundos en propagarse
fi
ok "Rol $ROL: solo lee el JAR de S3 y los parámetros /allday/*"

# ---------------------------------------------------------------------
paso "7/10 Balanceador de carga (ALB) y grupo de destino"
TG=$(aws elbv2 describe-target-groups --names allday-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || \
  aws elbv2 create-target-group --name allday-tg --protocol HTTP --port 8080 --vpc-id "$VPC" --target-type instance \
    --health-check-path /api/health --health-check-interval-seconds 15 --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 --matcher HttpCode=200 --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 modify-target-group-attributes --target-group-arn "$TG" --attributes Key=deregistration_delay.timeout_seconds,Value=30 >/dev/null
ALB=$(aws elbv2 describe-load-balancers --names allday-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || \
  aws elbv2 create-load-balancer --name allday-alb --type application --scheme internet-facing \
    --subnets $SUBNETS --security-groups "$SG_ALB" --query 'LoadBalancers[0].LoadBalancerArn' --output text)
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB" --query 'LoadBalancers[0].DNSName' --output text)
[ "$(aws elbv2 describe-listeners --load-balancer-arn "$ALB" --query 'length(Listeners)' --output text)" != "0" ] || \
  aws elbv2 create-listener --load-balancer-arn "$ALB" --protocol HTTP --port 80 \
    --default-actions Type=forward,TargetGroupArn="$TG" >/dev/null
ok "ALB $ALB_DNS (reparte entre servidores sanos según /api/health)"

# ---------------------------------------------------------------------
paso "8/10 Esperando la base de datos para completar la configuración"
aws rds wait db-instance-available --db-instance-identifier allday-db
DB_HOST=$(aws rds describe-db-instances --db-instance-identifier allday-db --query 'DBInstances[0].Endpoint.Address' --output text)
guardar /allday/DB_URL "jdbc:postgresql://$DB_HOST:5432/allday?sslmode=require"
ok "RDS lista en $DB_HOST (solo accesible desde sg-api, conexión cifrada)"

# ---------------------------------------------------------------------
paso "9/10 Servidores de la API: plantilla de lanzamiento y Auto Scaling"
AMI=$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --query Parameter.Value --output text)
sed -e "s|__BUCKET__|$BUCKET|" -e "s|__REGION__|$REGION|" "$RAIZ/aws/user-data-api.sh" > "$TMP/user-data.sh"
cat > "$TMP/lt.json" <<JSON
{ "ImageId": "$AMI", "InstanceType": "t3.micro",
  "IamInstanceProfile": { "Name": "$ROL" },
  "SecurityGroupIds": ["$SG_API"],
  "MetadataOptions": { "HttpTokens": "required", "HttpEndpoint": "enabled" },
  "UserData": "$(base64 -w0 "$TMP/user-data.sh")",
  "TagSpecifications": [{ "ResourceType": "instance", "Tags": [{ "Key": "Name", "Value": "allday-api" }] }] }
JSON
if aws ec2 describe-launch-templates --launch-template-names allday-lt >/dev/null 2>&1; then
  aws ec2 create-launch-template-version --launch-template-name allday-lt --launch-template-data "file://$TMP/lt.json" >/dev/null
else
  aws ec2 create-launch-template --launch-template-name allday-lt --launch-template-data "file://$TMP/lt.json" >/dev/null
fi
sanos() { aws elbv2 describe-target-health --target-group-arn "$TG" --query "length(TargetHealthDescriptions[?TargetHealth.State=='healthy'])" --output text; }
esperar_sanos() {
  for i in $(seq 1 60); do
    n=$(sanos); [ "$n" -ge "$1" ] && { ok "$n servidor(es) sano(s) en el balanceador"; return 0; }
    printf "  … %s/%s servidores sanos (%s s)\r" "$n" "$1" $((i*15)); sleep 15
  done
  falla "Los servidores no pasaron el chequeo de salud. Revise EC2 > Instancias > allday-api > Conectar (Session Manager) y: sudo journalctl -u allday -n 80"
}
if aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names allday-asg --query 'length(AutoScalingGroups)' --output text | grep -q 1; then
  # Ya existía: actualización progresiva (rolling) con el nuevo JAR, sin cortar el servicio
  aws autoscaling start-instance-refresh --auto-scaling-group-name allday-asg \
    --preferences '{"MinHealthyPercentage":50,"InstanceWarmup":180}' >/dev/null
  ok "Actualizando los servidores uno por uno (instance refresh)"
else
  # Se arranca con 1 servidor para que cree las tablas y cargue el catálogo una sola vez
  aws autoscaling create-auto-scaling-group --auto-scaling-group-name allday-asg \
    --launch-template 'LaunchTemplateName=allday-lt,Version=$Latest' \
    --min-size 1 --max-size 4 --desired-capacity 1 --vpc-zone-identifier "$SUBNETS_COMA" \
    --target-group-arns "$TG" --health-check-type ELB --health-check-grace-period 300 \
    --tags Key=Name,Value=allday-api,PropagateAtLaunch=true
  esperar_sanos 1
  aws autoscaling update-auto-scaling-group --auto-scaling-group-name allday-asg --min-size 2 --desired-capacity 2
  aws autoscaling put-scaling-policy --auto-scaling-group-name allday-asg --policy-name allday-cpu-50 \
    --policy-type TargetTrackingScaling --target-tracking-configuration \
    '{"PredefinedMetricSpecification":{"PredefinedMetricType":"ASGAverageCPUUtilization"},"TargetValue":50.0}' >/dev/null
  esperar_sanos 2
  ok "Auto Scaling: mínimo 2, máximo 4, escala si la CPU promedio pasa de 50 %"
fi

# ---------------------------------------------------------------------
paso "10/10 CloudFront: HTTPS para la web y la API en un mismo dominio"
OAC=$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='allday-oac'].Id | [0]" --output text)
[ "$OAC" != "None" ] || OAC=$(aws cloudfront create-origin-access-control --origin-access-control-config \
  Name=allday-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3 --query OriginAccessControl.Id --output text)
# Función que devuelve index.html en las rutas de React (/admin, /producto/…)
cat > "$TMP/spa.js" <<'JS'
function handler(event) {
  var r = event.request;
  if (r.uri.indexOf('.') === -1) { r.uri = '/index.html'; }
  return r;
}
JS
if ! aws cloudfront describe-function --name allday-spa >/dev/null 2>&1; then
  ET=$(aws cloudfront create-function --name allday-spa --function-config Comment="Rutas de React",Runtime=cloudfront-js-2.0 \
    --function-code "fileb://$TMP/spa.js" --query ETag --output text)
  aws cloudfront publish-function --name allday-spa --if-match "$ET" >/dev/null
fi
FN=$(aws cloudfront describe-function --name allday-spa --stage LIVE --query FunctionSummary.FunctionMetadata.FunctionARN --output text)
DIST=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='ALL DAY Arte - Detalles'].Id | [0]" --output text)
if [ "$DIST" = "None" ] || [ -z "$DIST" ]; then
cat > "$TMP/cf.json" <<JSON
{ "CallerReference": "allday-$(date +%s)", "Comment": "ALL DAY Arte - Detalles", "Enabled": true,
  "DefaultRootObject": "index.html", "PriceClass": "PriceClass_100", "HttpVersion": "http2",
  "Origins": { "Quantity": 2, "Items": [
    { "Id": "web-s3", "DomainName": "$BUCKET.s3.$REGION.amazonaws.com", "OriginPath": "/web",
      "S3OriginConfig": { "OriginAccessIdentity": "" }, "OriginAccessControlId": "$OAC" },
    { "Id": "api-alb", "DomainName": "$ALB_DNS",
      "CustomOriginConfig": { "HTTPPort": 80, "HTTPSPort": 443, "OriginProtocolPolicy": "http-only",
        "OriginReadTimeout": 30, "OriginKeepaliveTimeout": 5,
        "OriginSslProtocols": { "Quantity": 1, "Items": ["TLSv1.2"] } } } ] },
  "DefaultCacheBehavior": { "TargetOriginId": "web-s3", "ViewerProtocolPolicy": "redirect-to-https", "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"], "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } },
    "FunctionAssociations": { "Quantity": 1, "Items": [ { "EventType": "viewer-request", "FunctionARN": "$FN" } ] } },
  "CacheBehaviors": { "Quantity": 1, "Items": [
    { "PathPattern": "/api/*", "TargetOriginId": "api-alb", "ViewerProtocolPolicy": "https-only", "Compress": true,
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      "OriginRequestPolicyId": "216adef6-5c7f-47e4-b989-5492eafa07d3",
      "AllowedMethods": { "Quantity": 7, "Items": ["GET","HEAD","OPTIONS","PUT","POST","PATCH","DELETE"],
        "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } } } ] } }
JSON
  DIST=$(aws cloudfront create-distribution --distribution-config "file://$TMP/cf.json" --query Distribution.Id --output text)
else
  aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/index.html" >/dev/null
fi
DIST_ARN="arn:aws:cloudfront::$CUENTA:distribution/$DIST"
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "{
  \"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"SoloCloudFront\",\"Effect\":\"Allow\",
  \"Principal\":{\"Service\":\"cloudfront.amazonaws.com\"},\"Action\":\"s3:GetObject\",
  \"Resource\":\"arn:aws:s3:::$BUCKET/web/*\",\"Condition\":{\"StringEquals\":{\"AWS:SourceArn\":\"$DIST_ARN\"}}}]}"
DOMINIO=$(aws cloudfront get-distribution --id "$DIST" --query Distribution.DomainName --output text)
echo "  Publicando en los servidores de CloudFront (5-10 minutos la primera vez)…"
aws cloudfront wait distribution-deployed --id "$DIST"

cat > "$HOME/allday-estado.txt" <<TXT
URL=https://$DOMINIO
DISTRIBUCION=$DIST
ALB=$ALB_DNS
BUCKET=$BUCKET
RDS=$DB_HOST
REGION=$REGION
TXT
echo -e "\n\033[1;32m════════════════════════════════════════════════════════════"
echo "  ALL DAY está publicada:  https://$DOMINIO"
echo "  Panel del negocio:       https://$DOMINIO/admin   (admin@allday.ec)"
echo "  Prueba de balanceo:      bash $RAIZ/aws/prueba-balanceo.sh"
echo -e "════════════════════════════════════════════════════════════\033[0m"
