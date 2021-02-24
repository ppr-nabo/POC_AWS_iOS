import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import {Function, InlineCode, Runtime} from '@aws-cdk/aws-lambda'
import lambda = require('@aws-cdk/aws-lambda');
import event_sources = require('@aws-cdk/aws-lambda-event-sources');
import cognito = require('@aws-cdk/aws-cognito');
import { AuthorizationType, PassthroughBehavior } from '@aws-cdk/aws-apigateway';
import { CfnOutput } from "@aws-cdk/core";
import { Duration } from '@aws-cdk/core';
import apigw = require('@aws-cdk/aws-apigateway');
import * as fs from 'fs';
import { AutoDeleteBucket } from '@mobileposse/auto-delete-bucket'

const imageBucketName = "cdk-nabo-poc-images"

export class NaboAwsPocStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

        // =====================================================================================
        // S3 - Image Bucket
        // =====================================================================================
        const imageBucket = new AutoDeleteBucket(this, 'imageStorageResource', {
              bucketName: imageBucketName,
              publicReadAccess: true
            })
        new cdk.CfnOutput(this, 'imageBucket', { value: imageBucket.bucketName });

        // =====================================================================================
        // DynamoDB - Amazon DynamoDB table for storing image attributes
        // =====================================================================================
        const table = new dynamodb.Table(this, 'ImageAttributes', {
          partitionKey: { name: 'image', type: dynamodb.AttributeType.STRING },
          removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        new cdk.CfnOutput(this, 'ddbTable', { value: table.tableName });

        // =====================================================================================
        // AWS Lambda - Backend into which app can call into
        // =====================================================================================
        const serviceFn = new lambda.Function(this, 'backendServiceFunction', {
          code: new InlineCode(fs.readFileSync('servicelambda/index.py', {encoding: 'utf-8'})),
          //code: lambda.Code.fromAsset('servicelambda'),
          runtime: lambda.Runtime.PYTHON_3_7,
          handler: 'index.handler',
          environment: {
            "TABLE": table.tableName,
            "BUCKET": imageBucket.bucketName,
          },
        });
        imageBucket.grantWrite(serviceFn);
        table.grantReadWriteData(serviceFn);

        // =====================================================================================
        // API Gateway - To invoke AWS Lambda using REST
        // =====================================================================================
        const api = new apigw.LambdaRestApi(this, 'naboServiceAPI', {
          handler: serviceFn
        });
  }
}
