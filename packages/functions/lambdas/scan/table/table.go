package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/tealeg/xlsx"
)

type Request = events.APIGatewayV2HTTPRequest
type Response = events.APIGatewayV2HTTPResponse


type TableType = string

const (
    TableTypeXLSX TableType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

func getXLSXFile(body string) (*xlsx.File, error) {
    bytes, err := base64.StdEncoding.DecodeString(body)
    if err != nil {
        return nil, err
    }

    file, err := xlsx.OpenBinary(bytes)
    return file, err
}

func identifySheet(file *xlsx.File) (*xlsx.Sheet, error) {
    if len(file.Sheets) == 0 {
        return nil, fmt.Errorf("no sheets")
    }
    // if len(file.Sheets) == 1 {
    return file.Sheets[0], nil
    // }
}

func parseXLSX(body string) (any, error) {
    file, err := getXLSXFile(body)
    if err != nil {
        return nil, err
    }
    
    sheet, err := identifySheet(file)
    _, _  = sheet, err
    for sht := range file.Sheets {
        _ = sht
    }
    return nil, nil
}


func handler(ctx context.Context, req Request) (*Response, error) {
    log.Println(req.Body)
    ty, ok := req.Headers["content-type"]
    if !ok {
        return nil, fmt.Errorf("no content type")
    }

    switch TableType(ty) {
        case TableTypeXLSX:
            data, err := parseXLSX(req.Body)
            log.Println(data, err)
    }
    log.Println(req.Headers["content-type"])
    return nil, nil
}

func main() {
    lambda.Start(handler)
}
