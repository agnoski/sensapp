import * as cdk from "@aws-cdk/core";
import * as sens_app_service from "../lib/sens_app_service";

export class SensAppCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new sens_app_service.SensAppService(this, "SensApp");
  }
}
