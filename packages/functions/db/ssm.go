package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/probably-neb/paypals-api/util"
)

func createClient() *ssm.Client {
    ctx := context.Background()
    cfg, err := config.LoadDefaultConfig(ctx)
    if err != nil {
        log.Fatalf("Could not load config: %v", err)
    }
    return ssm.NewFromConfig(cfg)
}

var client *ssm.Client = createClient();
var sstPrefix = os.Getenv("SST_SSM_PREFIX")

func getPath(envVar string) string {
    // TODO: error handling: invalid path results in non descriptive error
    return fmt.Sprintf("%sSecret/%s/value",sstPrefix, envVar)
}


func getSecret(path string) (string, error) {
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
    return getSecret(path)
}

func GetJWTPublicKey() (string, error) {
    path := sstPrefix + "Auth/auth/publicKey"
    return getSecret(path)
}
