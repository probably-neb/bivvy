package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"

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
    // jsn, _ := json.Marshal(resp)
    // log.Println("response", string(jsn))
    return resp, err
}

type Item struct {
    Amount float64 `json:"amount"`
    Name string `json:"name"`
    Confidence float32 `json:"confidence"`
}

type ReceiptSummary struct {
    Total *float64 `json:"total"`
    Tax *float64 `json:"tax"`
    Date *string `json:"date"`
    Vendor *string `json:"vendor"`
    VendorAddress *string `json:"vendorAddress"`
}

type Receipt struct {
    ReceiptSummary
    Items []Item `json:"items"`
}

func scanFloat64(dest *float64, str string) error {
    val, err := strconv.ParseFloat(str, 64)
    if err != nil {
        return err
    }
    *dest = val
    return nil
}

func scanFloat64Ref(dest **float64, str string) error {
    val := 0.0
    err := scanFloat64(&val, str)
    if err != nil {
        return err
    }
    *dest = &val
    return nil
}

func getFieldLabel(field textractTypes.ExpenseField) (label string, ok bool) {
    if field.Type != nil && field.Type.Text != nil {
        label = *field.Type.Text
        ok = true
    }
    return
}

func getFieldValue(field textractTypes.ExpenseField) (value string, ok bool) {
    if field.ValueDetection != nil && field.ValueDetection.Text != nil {
        value = *field.ValueDetection.Text
        ok = true
    }
    return
}

func getFieldLabelAndValue(field textractTypes.ExpenseField) (label string, value string, ok bool) {
    label, ok = getFieldLabel(field)
    if !ok {
        return
    }
    value, ok = getFieldValue(field)
    return
}

func parseLineItemExpense(fields []textractTypes.ExpenseField) (Item, error) {
    item := Item{}
    item.Confidence = 1.0

    productCode := ""

    for _, field := range fields {
        label, value, ok := getFieldLabelAndValue(field)
        if !ok {
            continue
        }

        used := true
        switch label {
        case "PRICE":
            err := scanFloat64(&item.Amount, value)
            if err != nil {
                log.Println("error parsing price", err)
            }
        case "ITEM":
            item.Name = value
        case "PRODUCT_CODE":
            productCode = value
            used = false
        default:
            used = false
            log.Println("unused field", label, value)
        // TODO: PRODUCT_CODE and replace in ITEM if found
        }
        log.Println("parsed field", label, value, *field.ValueDetection.Confidence, *field.Type.Confidence )
        if used {
            item.Confidence *= (*field.ValueDetection.Confidence / 100.0)
            item.Confidence *= (*field.Type.Confidence / 100.0)
        }
    }
    // sometimes the product code is in the item name
    if productCode != "" && item.Name != "" {
        item.Name = strings.ReplaceAll(item.Name, productCode, "")
        item.Name = strings.TrimSpace(item.Name)
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

func getExpenseFieldLabel(field textractTypes.ExpenseField) (string, bool) {
    var (
        label string
        ok = false
    )

    if field.LabelDetection != nil && field.LabelDetection.Text != nil {
        label = *field.LabelDetection.Text
        ok = true
    }
    if field.Type != nil && field.Type.Text != nil {
        label = *field.Type.Text
        ok = true
        log.Println("field type", *field.Type.Text)
    }

    return label, ok
}

func getExpenseFieldValue(field textractTypes.ExpenseField) (string, bool) {
    var (
        value string
        ok = false
    )
    if field.ValueDetection != nil && field.ValueDetection.Text != nil {
        value = *field.ValueDetection.Text
        ok = true
    }
    return value, ok
}

type SummaryField int
const (
    SummaryOther SummaryField = iota
    SummaryTotal
    SummaryTax
    SummaryDate
    SummaryVendor
    SummaryVendorAddress
)

func identifySummaryField(label string) (SummaryField, bool) {
    var (
        field = SummaryOther
    )

    switch label {
    case "TOTAL":
        field = SummaryTotal
    case "TAX":
        field = SummaryTax
    case "INVOICE_RECEIPT_DATE":
        field = SummaryDate
    case "VENDOR_NAME":
        field = SummaryVendor
    case "VENDOR_ADDRESS":
        field = SummaryVendorAddress
    default:
        return field, false
    }
    log.Println("identified summary field", label, field)
    return field, true
}

func parseSummaryField(summary *ReceiptSummary, label string, value string) {
    field, ok := identifySummaryField(label)
    if !ok {
        return
    }
    switch field {
    case SummaryTotal:
        err := scanFloat64Ref(&summary.Total, value)
        if err != nil {
            log.Println("error parsing summary total", err)
            return
        }
    case SummaryTax:
        err := scanFloat64Ref(&summary.Tax, value)
        if err != nil {
            log.Println("error parsing summary tax", err)
            return
        }
    case SummaryDate:
        summary.Date = &value
    case SummaryVendor:
        summary.Vendor = &value
    case SummaryVendorAddress:
        value = strings.ReplaceAll(value, "\n", " ")
        summary.VendorAddress = &value
    }
}

func parseSummary(summaryFields []textractTypes.ExpenseField) (ReceiptSummary, error) {
    summary := ReceiptSummary{ }
    for _, field := range summaryFields {
        label, ok := getExpenseFieldLabel(field)
        if !ok {
            continue
        }

        value, ok := getExpenseFieldValue(field)
        if !ok {
            continue
        }
        log.Printf("found summary field [%v]: %v", label, value)
        parseSummaryField(&summary, label, value)

    }
    return summary, nil
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

    summary, err := parseSummary(doc.SummaryFields)
    if err != nil {
        log.Println("error parsing summary", err)
    }
    receipt.ReceiptSummary = summary

    items, err := parseLineItemGroups(doc.LineItemGroups)
    if err != nil {
        log.Println("error parsing line item groups", err)
    }
    receipt.Items = items

    return &receipt, nil
}

func handler(ctx context.Context, req Request) (*Response, error) {
    image, err := base64.StdEncoding.DecodeString(req.Body)
    if err != nil {
        return nil, err
    }
    txt := getTextract(ctx)
    info, err := analyze(ctx, txt, image)
    if err != nil {
        log.Print("error analyzing receipt", err)
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
        receiptJson, _ = json.Marshal(map[string]string{"error": err.Error()})
    }
    res := Response {
        StatusCode: status,
        Body: string(receiptJson),
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
    }
    log.Println("response", res.StatusCode, res.Body)
    return &res, err
}

func main() {
    lambda.Start(handler)
}
