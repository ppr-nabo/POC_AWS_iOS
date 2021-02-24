import logging
import boto3
from botocore.exceptions import ClientError
import os
import json


# Constructors for Amazon DynamoDB and S3 resource object
dynamodb = boto3.resource('dynamodb')
s3 = boto3.resource('s3')

def handler(event, context):

    image_labels_table = os.environ['TABLE']
    table = dynamodb.Table(image_labels_table)
    key = "watching_chutney"

    try:
        response = table.get_item(Key={'image': key})
        item = response['Item']

        return {
            'statusCode': 200,
            'body': json.dumps(item)
        }

    except ClientError as e:
        logging.error(e)
        return "No labels or error"