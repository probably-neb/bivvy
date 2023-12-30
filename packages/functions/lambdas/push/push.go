package main

import (
	"github.com/aws/aws-lambda-go/lambda"

    "github.com/probably-neb/paypals-api/push"
)

func main() {
    lambda.Start(push.Handler)
}
