import {
    Textract,
    AnalyzeExpenseRequest,
    AnalyzeExpenseResponse,
    ExpenseField,
} from "@aws-sdk/client-textract";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import Status from "util/status";

export interface ReceiptInfoValue {
    value: string;
    confidence: number;
    suggestion?: string;
}

export interface ReceiptInfo {
    total: ReceiptInfoValue;
    date: ReceiptInfoValue;
    purchaseLocation: ReceiptInfoValue;
    tax: ReceiptInfoValue;
    items: Array<{
        name: ReceiptInfoValue;
        price: ReceiptInfoValue;
        confidence: number;
    }>;
}

const CACHED_RESPONSE_PATH = "./receipt.json";

async function analyzeReceipt(receiptImage: Buffer): Promise<ReceiptInfo> {
    let response: AnalyzeExpenseResponse;

    response: {
        let isLocal = process.env.IS_LOCAL === "true";

        if (isLocal) {
            const fs = await import("node:fs");
            try {
                response = JSON.parse(
                    fs!.readFileSync(CACHED_RESPONSE_PATH).toString("utf-8")
                );
                console.log(
                    "using cached response",
                    (await import("node:path")).resolve(CACHED_RESPONSE_PATH)
                );
                break response;
            } catch (e) {
                console.error("failed to read cached response", e);
                try {
                    if (fs.existsSync(CACHED_RESPONSE_PATH)) {
                        fs.rmSync(CACHED_RESPONSE_PATH);
                    }
                } catch (e) {
                    console.error(
                        "failed to check if cached response exists and remove it if it does",
                        e
                    );
                }
            }
        }

        const textract = new Textract();

        const params: AnalyzeExpenseRequest = {
            Document: {
                Bytes: receiptImage,
            },
        };

        response = await textract.analyzeExpense(params);

        if (isLocal) {
            const fs = await import("node:fs");
            // TODO: store cached response by hash of file in /tmp/
            // so uploading different receipts doesn't break stuff
            fs.writeFileSync(
                CACHED_RESPONSE_PATH,
                JSON.stringify(response, undefined, 4)
            );
        }
    }

    if (!response.ExpenseDocuments || response.ExpenseDocuments.length === 0) {
        throw new Error("No expense document found in the image");
    }

    console.log("Num Documents:", response.ExpenseDocuments?.length);

    const receiptInfo: ReceiptInfo = {
        total: { value: "", confidence: 0 },
        date: { value: "", confidence: 0 },
        purchaseLocation: { value: "", confidence: 0 },
        tax: { value: "", confidence: 0 },
        items: [],
    };

    // parse response
    parseResponse: {
        const expenseDocument = response.ExpenseDocuments[0];

        function expenseFieldConfidence(field: ExpenseField): number {
            const confidenceTyp = field.Type?.Confidence;
            const confidenceVal = field.ValueDetection?.Confidence;
            return Math.min(
                confidenceTyp ?? confidenceVal ?? 0,
                confidenceVal ?? confidenceTyp ?? 0
            );
            // NOTE: above is
            // one  null => Math.min(other, other)
            // both null => Math.min(0, 0)
            // not  null => math.min(typ, val)
        }

        // Process summary fields
        for (const field of expenseDocument.SummaryFields ?? []) {
            if (field.Type == null) {
                continue;
            }

            const fieldType = field.Type.Text;

            const fieldConfidence = expenseFieldConfidence(field);

            if (fieldType === "TOTAL") {
                receiptInfo.total = {
                    value: field.ValueDetection?.Text || "",
                    confidence: fieldConfidence,
                };
            } else if (fieldType === "INVOICE_RECEIPT_DATE") {
                receiptInfo.date = {
                    value: field.ValueDetection?.Text || "",
                    confidence: fieldConfidence,
                };
            } else if (fieldType === "VENDOR_NAME") {
                receiptInfo.purchaseLocation = {
                    value: field.ValueDetection?.Text || "",
                    confidence: fieldConfidence,
                };
            } else if (fieldType === "TAX") {
                receiptInfo.tax = {
                    value: field.ValueDetection?.Text || "",
                    confidence: fieldConfidence,
                };
            }
        }

        if (expenseDocument.LineItemGroups == null) {
            break parseResponse;
        }

        for (const group of expenseDocument.LineItemGroups) {
            if (group.LineItems == null) {
                continue;
            }
            // TODO: save group
            for (const lineItem of group.LineItems) {
                // console.log(lineItem.LineItemExpenseFields);
                let itemName: string | undefined;
                let itemPrice: string | undefined;

                let confidenceName: number = 0;
                let confidencePrice: number = 0;

                for (const field of lineItem.LineItemExpenseFields ?? []) {
                    const fieldType = field.Type?.Text;
                    if (field.Type == null) {
                        continue;
                    }

                    console.log(fieldType);
                    if (fieldType === "ITEM") {
                        itemName = field.ValueDetection?.Text ?? "";
                        confidenceName = expenseFieldConfidence(field);
                    } else if (fieldType === "PRICE") {
                        itemPrice = field.ValueDetection?.Text ?? "";
                        confidenceName = expenseFieldConfidence(field);
                        continue;
                    }
                }

                if (itemName == null && itemPrice == null) {
                    continue;
                }

                receiptInfo.items.push({
                    name: {
                        value: itemName ?? "",
                        confidence: confidenceName,
                    },
                    price: {
                        value: itemPrice ?? "",
                        confidence: confidencePrice,
                    },
                    confidence: Math.min(confidenceName, confidencePrice),
                });
            }
        }
    }

    return receiptInfo;
}

export const handler: APIGatewayProxyHandlerV2 = async function (evt) {
    const body = evt.body
    if (body == null) {
        return {
            statusCode: Status.BAD_REQUEST,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                error: "No File Provided",
            }),
        };
    }

    let info;
    try {
        info = await analyzeReceipt(Buffer.from(body, "base64"));
    } catch (e) {
        console.error("failed to run textract on receipt", e);
        return {
            statusCode: Status.BAD_REQUEST,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                error: "Failed to Scan Receipt",
            }),
        };
    }

    const res = {
        statusCode: Status.OK,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(info),
    };
    console.dir(info, { depth: null });
    return info;
};
