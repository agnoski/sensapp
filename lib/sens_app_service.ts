import * as core from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as path from "path";

export class SensAppService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const table = new dynamodb.Table(this, "database", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
    });

    const postMesuresLambda = new lambda.Function(this, "ApiPostMeasures", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../assets/lambda/post-measures")
      ),
      handler: "index.main",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(postMesuresLambda);

    const getMesureLambda = new lambda.Function(this, "ApiGetMeasure", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../assets/lambda/get-measure")
      ),
      handler: "index.main",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadData(getMesureLambda);

    const getInfoLambda = new lambda.Function(this, "ApiGetInfo", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../assets/lambda/get-info")
      ),
      handler: "index.main",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadData(getInfoLambda);

    const api = new apigateway.RestApi(this, "api", {
      restApiName: "SensAppAPI",
      description: "This SensApp API.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
      deployOptions: {
        stageName: "dev",
      },
    });

    new core.CfnOutput(this, "apiUrl", { value: api.url });

    const sensors = api.root.addResource("sensors");
    const sensor = sensors.addResource("{sensorId}");
    const info = sensor.addResource("info");
    const measures = sensor.addResource("measures");
    const measure = measures.addResource("{measureName}");

    info.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getInfoLambda, { proxy: true })
    );

    measures.addMethod(
      "POST",
      new apigateway.LambdaIntegration(postMesuresLambda, { proxy: true })
    );

    measure.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getMesureLambda, { proxy: true })
    );
  }
}
