package util

import (
	"log"
	"time"
)

func TimeMe(t time.Time, label string) {
    elapsed := time.Since(t).Abs().Milliseconds()
    // trick go into thinking we use these vars
    _ = elapsed
    _ = log.Ltime
    // log.Printf("%s took %dms", label, elapsed)
}
