package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strconv"

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

// https://docs.aws.amazon.com/textract/latest/dg/expensedocuments.html
// https://www.edenai.co/post/ocr-receipt-api-which-best-to-choose-for-receipt-parsing
/* NOTE:
    aws:
        - $0.10 per reciept
        - model pretty good (don't know how good it will be at warped images)
        - response is wierd
    veryfi:
        - $0.08 per reciept
        - model better
        - standard response
        - plan is $500 minimum???
*/
func analyze(ctx context.Context, txt *textract.Client, image []byte) (*textract.AnalyzeExpenseOutput, error) {
    cmd := textract.AnalyzeExpenseInput{
        Document: &textractTypes.Document{
            Bytes: image,
        },
    }
    resp, err := txt.AnalyzeExpense(ctx, &cmd)
    return resp, err
}

type Item struct {
    Amount float64 `json:"amount"`
    Name string `json:"name"`
    Confidence float32 `json:"confidence"`
}

type ReceiptSummary struct {
    Total float64 `json:"total"`
    Date string `json:"date"`
    Vendor string `json:"vendor"`
    VendorAddress string `json:"vendorAddress"`
}

type Receipt struct {
    ReceiptSummary
    Items []Item `json:"items"`
}

func parseLineItemExpense(fields []textractTypes.ExpenseField) (Item, error) {
    item := Item{}
    item.Confidence = 1.0
    for _, field := range fields {
        if field.Type == nil || field.ValueDetection == nil {
            return item, fmt.Errorf("field missing type or value detection")
        }
        if field.Type.Text == nil || field.ValueDetection.Text == nil {
            return item, fmt.Errorf("field type or value detection missing text")
        }
        used := true
        label := *field.Type.Text
        value := *field.ValueDetection.Text
        var err error
        switch label {
            case "PRICE":
                amount, err := strconv.ParseFloat(value, 64)
                item.Amount = amount
                if err != nil {
                    return item, err
                }
            case "ITEM":
                item.Name = value
        default:
            used = false
            log.Println("unused field", label, value)
        // TODO: PRODUCT_CODE and replace in ITEM if found
        }
        if err != nil {
            return item, err
        }
        log.Println("parsed field", label, value, *field.ValueDetection.Confidence, *field.Type.Confidence )
        if used {
            item.Confidence *= (*field.ValueDetection.Confidence / 100.0)
            item.Confidence *= (*field.Type.Confidence / 100.0)
        }
    }
    log.Println("parsed item", item)
    return item, nil
}

func parseLineItemGroup(group textractTypes.LineItemGroup) ([]Item, error) {
    items := make([]Item, len(group.LineItems))

    for i, lineItem := range group.LineItems {
        item, err := parseLineItemExpense(lineItem.LineItemExpenseFields)
        if err != nil {
            log.Println("error parsing line item expense", err)
        }
        items[i] = item
    }
    log.Println("parsed line item group", items)

    return items, nil
}

func parseLineItemGroups(groups []textractTypes.LineItemGroup) ([]Item, error) {
    items := make([]Item, 0)
    for _, group := range groups {
        groupItems, err := parseLineItemGroup(group)
        if err != nil {
            log.Println("error parsing line item group", err)
        }
        // TODO: how to diff multiple groups?
        items = append(items, groupItems...)
    }
    log.Println("parsed line item groups", items)
    return items, nil
}

func parseSummary(summaryFields []textractTypes.ExpenseField) (ReceiptSummary, error) {
    return ReceiptSummary{
        Total: 0.0,
        Date: "",
        Vendor: "",
        VendorAddress: "",
    }, nil
}

func parse(resp *textract.AnalyzeExpenseOutput) (*Receipt, error) {
    if resp == nil {
        return nil, fmt.Errorf("nil response")
    }
    docs := resp.ExpenseDocuments
    if len(docs) == 0 {
        return nil, fmt.Errorf("no returned documents")
    }
    doc := docs[0]

    receipt := Receipt{}

    items, err := parseLineItemGroups(doc.LineItemGroups)
    if err != nil {
        log.Println("error parsing line item groups", err)
    }
    receipt.Items = items

    summary, err := parseSummary(doc.SummaryFields)
    if err != nil {
        log.Println("error parsing summary", err)
    }
    receipt.ReceiptSummary = summary

    return &receipt, nil
}

func handler(ctx context.Context, req Request) (*Response, error) {
    image, err := base64.StdEncoding.DecodeString(req.Body)
    txt := getTextract(ctx)
    info, err := analyze(ctx, txt, image)
    if err != nil {
        return nil, err
    }
    receipt, err := parse(info)
    if err != nil {
        log.Println("error parsing receipt", err)
        return nil, err
    }
    receiptJson, err := json.Marshal(receipt)
    status := 200
    if err != nil {
        status = 500
        receiptJson = []byte(`{"error": "` + err.Error() + `"}`)
    }
    res := Response {
        StatusCode: status,
        Body: string(receiptJson),
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
    }
    return &res, err
}

func main() {
    lambda.Start(handler)
}
