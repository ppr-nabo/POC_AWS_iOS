#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NaboAwsPocStack } from '../lib/nabo-aws-poc-stack';

const app = new cdk.App();
new NaboAwsPocStack(app, 'NaboAwsPocStack');
