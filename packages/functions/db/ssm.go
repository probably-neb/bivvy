package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/probably-neb/paypals-api/util"
)

func getPath(envVar string) string {
    // TODO: error handling: invalid path results in non descriptive error
    prefix := os.Getenv("SST_SSM_PREFIX")
    return fmt.Sprintf("%sSecret/%s/value",prefix, envVar)
}

func createClient() (*ssm.Client, error) {
    ctx := context.Background()
    cfg, err := config.LoadDefaultConfig(ctx)
    if err != nil {
        return nil, err
    }
    return ssm.NewFromConfig(cfg), nil
}

func getSecret(client *ssm.Client, path string) (string, error) {
    wd := true
    ctx := context.Background()
    input := &ssm.GetParameterInput{
        Name: &path,
        WithDecryption: &wd,
    }
    resp, err := client.GetParameter(ctx, input)
    if err != nil {
        return "", err
    }
    return *resp.Parameter.Value, nil
}

func GetSecret(envVar string) (string, error) {
    defer util.TimeMe(time.Now(), "GetSecret: " + envVar)
    // TODO: cache in top level var for requests in same lambda
    path := getPath(envVar)
    client, err := createClient()
    if err != nil {
        return "", err
    }
    return getSecret(client, path)
}
