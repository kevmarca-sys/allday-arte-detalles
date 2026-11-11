#!/bin/bash
# =====================================================================
#  ALL DAY · Elimina TODO lo que creó desplegar.sh (para no gastar créditos)
#  ¡Borra también la base de datos de AWS! Ejecutar solo después de la defensa.
# =====================================================================
set -uo pipefail
export AWS_PAGER=""
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"; export AWS_DEFAULT_REGION="$REGION"
CUENTA=$(aws sts get-caller-identity --query Account --output text)
BUCKET="allday-${CUENTA}-${REGION}"
read -r -p "Esto borra la web, los servidores y la BASE DE DATOS de ALL DAY en AWS. Escriba BORRAR para continuar: " R
[ "$R" = "BORRAR" ] || { echo "Cancelado."; exit 0; }
p() { echo -e "\n\033[1;33m▶ $*\033[0m"; }

p "CloudFront (deshabilitar y borrar; tarda unos minutos)"
DIST=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='ALL DAY Arte - Detalles'].Id | [0]" --output text)
if [ "$DIST" != "None" ] && [ -n "$DIST" ]; then
  aws cloudfront get-distribution-config --id "$DIST" > /tmp/cf.json
  ET=$(jq -r .ETag /tmp/cf.json); jq '.DistributionConfig.Enabled=false | .DistributionConfig' /tmp/cf.json > /tmp/cf-off.json
  aws cloudfront update-distribution --id "$DIST" --if-match "$ET" --distribution-config file:///tmp/cf-off.json >/dev/null
  aws cloudfront wait distribution-deployed --id "$DIST"
  aws cloudfront delete-distribution --id "$DIST" --if-match "$(aws cloudfront get-distribution --id "$DIST" --query ETag --output text)"
fi
ET=$(aws cloudfront describe-function --name allday-spa --query ETag --output text 2>/dev/null) && aws cloudfront delete-function --name allday-spa --if-match "$ET"
OAC=$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='allday-oac'].Id | [0]" --output text)
[ "$OAC" != "None" ] && aws cloudfront delete-origin-access-control --id "$OAC" --if-match "$(aws cloudfront get-origin-access-control --id "$OAC" --query ETag --output text)"

p "Auto Scaling Group, plantilla y balanceador"
aws autoscaling delete-auto-scaling-group --auto-scaling-group-name allday-asg --force-delete 2>/dev/null
ALB=$(aws elbv2 describe-load-balancers --names allday-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null) && \
  aws elbv2 delete-load-balancer --load-balancer-arn "$ALB" && aws elbv2 wait load-balancers-deleted --load-balancer-arns "$ALB"
while aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names allday-asg --query 'length(AutoScalingGroups)' --output text | grep -q 1; do sleep 15; done
TG=$(aws elbv2 describe-target-groups --names allday-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null) && aws elbv2 delete-target-group --target-group-arn "$TG"
aws ec2 delete-launch-template --launch-template-name allday-lt >/dev/null 2>&1

p "RDS (sin copia final)"
aws rds delete-db-instance --db-instance-identifier allday-db --skip-final-snapshot --delete-automated-backups >/dev/null 2>&1 && \
  aws rds wait db-instance-deleted --db-instance-identifier allday-db
aws rds delete-db-subnet-group --db-subnet-group-name allday-db-subnets 2>/dev/null

p "Grupos de seguridad"
sleep 30
for g in allday-sg-db allday-sg-api allday-sg-alb; do
  id=$(aws ec2 describe-security-groups --filters Name=group-name,Values=$g --query 'SecurityGroups[0].GroupId' --output text)
  [ "$id" != "None" ] && aws ec2 delete-security-group --group-id "$id"
done

p "IAM, S3 y Parameter Store"
aws iam remove-role-from-instance-profile --instance-profile-name allday-ec2-role --role-name allday-ec2-role 2>/dev/null
aws iam delete-instance-profile --instance-profile-name allday-ec2-role 2>/dev/null
aws iam detach-role-policy --role-name allday-ec2-role --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore 2>/dev/null
aws iam delete-role-policy --role-name allday-ec2-role --policy-name allday-minimo 2>/dev/null
aws iam delete-role --role-name allday-ec2-role 2>/dev/null
aws s3 rb "s3://$BUCKET" --force 2>/dev/null
aws ssm delete-parameters --names /allday/DB_URL /allday/DB_USER /allday/DB_PASSWORD /allday/JWT_SECRET /allday/ADMIN_PASSWORD /allday/CORS_ORIGINS >/dev/null
rm -f "$HOME/allday-estado.txt"
echo -e "\n\033[1;32mListo: no queda nada de ALL DAY en AWS.\033[0m"
