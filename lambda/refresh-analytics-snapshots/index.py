import os, json, time, uuid, boto3

region = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION') or 'us-east-1'
ddb = boto3.client('dynamodb', region_name=region)

TABLE_TOKENS = os.environ.get('TABLE_TOKENS', 'huntaze-oauth-tokens')
TABLE_ANALYTICS = os.environ.get('TABLE_ANALYTICS', 'huntaze-analytics-events')
TTL_DAYS = int(os.environ.get('ANALYTICS_TTL_DAYS', '60'))

def put_snapshot(platform: str, payload: dict):
    ts = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    day = ts[:10]
    event_id = str(uuid.uuid4())
    ttl = int(time.time()) + TTL_DAYS * 24 * 60 * 60
    item = {
        'day': { 'S': day },
        'sk': { 'S': f'ts#{ts}#{event_id}' },
        'ts': { 'S': ts },
        'eventId': { 'S': event_id },
        'platform': { 'S': platform },
        'type': { 'S': 'stat_snapshot' },
        'payload': { 'S': json.dumps(payload) },
        'ttl': { 'N': str(ttl) },
    }
    ddb.put_item(TableName=TABLE_ANALYTICS, Item=item)

def lambda_handler(event, context):
    # Minimal: scan tokens table and emit generic stat_snapshot per platform entry
    try:
        resp = ddb.scan(TableName=TABLE_TOKENS, Limit=100)
    except Exception as e:
        return { 'status': 'error', 'message': str(e) }

    count = 0
    for it in resp.get('Items', []):
        platform = it.get('platform', {}).get('S') or 'unknown'
        user_id = it.get('userId', {}).get('S') or None
        # TODO: call provider APIs here to fetch real stats
        payload = { 'userId': user_id, 'note': 'scheduled snapshot (placeholder)' }
        try:
            put_snapshot(platform, payload)
            count += 1
        except Exception:
            pass

    return { 'status': 'ok', 'snapshots': count }

