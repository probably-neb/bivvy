package main

import (
    "github.com/aws/aws-lambda-go/lambda"

	"github.com/probably-neb/paypals-api/pull"
)

func main() {
    lambda.Start(pull.Handler)
}
