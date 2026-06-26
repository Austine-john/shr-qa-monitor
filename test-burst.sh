#!/bin/bash
# Simulates high-frequency burst of FHIR callbacks (ZenHub #8421 - Batch Processing)

TARGET=${1:-http://localhost:3001/api/v1/callback}
COUNT=${2:-50}

echo "Sending $COUNT callbacks to $TARGET..."

RESOURCE_TYPES=("Observation" "Condition" "Coverage" "Patient" "Encounter" "MedicationRequest")

for i in $(seq 1 $COUNT); do
  RT=${RESOURCE_TYPES[$((RANDOM % ${#RESOURCE_TYPES[@]}))]}
  TRACE="trace-burst-$(printf '%04d' $i)"
  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

  # Alternate between wrapped and unwrapped
  if (( i % 3 == 0 )); then
    PAYLOAD=$(cat <<EOF
{
  "topic": "fhir.${RT,,}",
  "partition": $((i % 4)),
  "offset": $i,
  "key": "${RT,,}-${i}",
  "headers": {"traceId": "$TRACE"},
  "value": {
    "resourceType": "$RT",
    "id": "${RT,,}-${i}",
    "agentId": "agent-ke-mfl-$(printf '%03d' $((RANDOM % 10)))",
    "bundleId": "bundle-batch-$(printf '%03d' $((i / 5)))",
    "meta": {"lastUpdated": "$TIMESTAMP"}
  }
}
EOF
)
  else
    PAYLOAD=$(cat <<EOF
{
  "resourceType": "$RT",
  "id": "${RT,,}-${i}",
  "traceId": "$TRACE",
  "agentId": "agent-ke-mfl-$(printf '%03d' $((RANDOM % 10)))",
  "bundleId": "bundle-batch-$(printf '%03d' $((i / 5)))",
  "meta": {"lastUpdated": "$TIMESTAMP"}
}
EOF
)
  fi

  curl -s -X POST "$TARGET" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" > /dev/null &

  # Small delay to avoid overwhelming; remove for true burst test
  if (( i % 10 == 0 )); then
    wait
    echo "  Sent $i/$COUNT"
  fi
done

wait
echo "Done. $COUNT callbacks sent."
