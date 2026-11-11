#!/bin/bash
# =====================================================================
#  ALL DAY · Pruebas de la infraestructura desplegada (ejecutar en CloudShell)
#   1) Balanceo: 20 peticiones a /api/health y cuántas respondió cada servidor
#   2) Carga: 30 s con 50 usuarios simultáneos sobre el catálogo público
#   3) Seguridad: la base y el ALB no deben responder desde Internet
# =====================================================================
set -uo pipefail
export AWS_PAGER=""
source <(sed 's/^/export /' "$HOME/allday-estado.txt")
echo "Sitio: $URL"

echo -e "\n== 1) Balanceo de carga (20 peticiones a /api/health) =="
for i in $(seq 1 20); do curl -s "$URL/api/health"; echo; done | tee /tmp/allday-health.txt | head -5
echo "… respuestas por servidor:"
grep -o '"servidor":"[^"]*"' /tmp/allday-health.txt | sort | uniq -c

echo -e "\n== 2) Prueba de carga (50 conexiones durante 30 s) =="
npx --yes autocannon@7.15.0 -c 50 -d 30 "$URL/api/public/productos" 2>&1 | tail -25

echo -e "\n== 3) Controles de seguridad =="
echo -n "HTTP redirige a HTTPS: "; curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "http://${URL#https://}/"
echo -n "ALB directo desde Internet (debe fallar por tiempo de espera): "
curl -s -m 5 -o /dev/null -w "%{http_code}\n" "http://$ALB/api/health" || echo "bloqueado ✔"
echo -n "Panel sin token (debe dar 401): "; curl -s -o /dev/null -w "%{http_code}\n" "$URL/api/ventas"
echo -n "RDS pública: "; aws rds describe-db-instances --db-instance-identifier allday-db --query 'DBInstances[0].PubliclyAccessible' --output text

echo -e "\n== Estado del Auto Scaling Group =="
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names allday-asg \
  --query 'AutoScalingGroups[0].Instances[].[InstanceId,AvailabilityZone,HealthStatus,LifecycleState]' --output table
