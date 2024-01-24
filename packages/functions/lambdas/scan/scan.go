package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/textract"
	textractTypes "github.com/aws/aws-sdk-go-v2/service/textract/types"
)

type Request = events.APIGatewayV2HTTPRequest
type Response = events.APIGatewayV2HTTPResponse

func getTextract(ctx context.Context) *textract.Client {
    cfg, err := config.LoadDefaultConfig(ctx)
    if err != nil {
        log.Fatalf("Could not load config: %v", err)
    }
    txt := textract.NewFromConfig(cfg)
    return txt
}

func analyze(ctx context.Context, txt *textract.Client, image []byte) (*textract.AnalyzeExpenseOutput, error) {
    cmd := textract.AnalyzeExpenseInput{
        Document: &textractTypes.Document{
            Bytes: image,
        },
    }
    resp, err := txt.AnalyzeExpense(ctx, &cmd)
    return resp, err
}

func handler(ctx context.Context, req Request) (*Response, error) {
    image, err := base64.StdEncoding.DecodeString(req.Body)
    txt := getTextract(ctx)
    info, err := analyze(ctx, txt, image)
    log.Println(info)
    if err != nil {
        return nil, err
    }
    infoJson, err := json.Marshal(info)
    status := 200
    if err != nil {
        status = 500
        infoJson = []byte(`{"error": "` + err.Error() + `"}`)
    }
    res := Response {
        StatusCode: status,
        Body: string(infoJson),
    }
    return &res, err
}

func main() {
    lambda.Start(handler)
}
