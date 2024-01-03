package db

import (
	"fmt"
	"log"

	"github.com/golang-jwt/jwt"
)

type SessionType int
const (
    UserSessionType SessionType = iota
    PublicSessionType
)


type Session interface {
    SessionType() SessionType
}

type UserSession struct {
    UserId string
}

func (s UserSession) SessionType() SessionType {
    return UserSessionType
}

type PublicSession struct { }

func (s PublicSession) SessionType() SessionType {
    return PublicSessionType
}

var signingMethod = jwt.SigningMethodRS512

func GetSession(tokenString string) Session {
    token, err := jwt.Parse(tokenString, func (token *jwt.Token) (any, error) {
        if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
        }
        publicKeyPem, err := GetJWTPublicKey()
        if (err != nil) {
            log.Fatalf("Could not get jwt public key: %v", err)
        }
        publicKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(publicKeyPem))
        return publicKey, nil
    })
    if err != nil {
        log.Fatalf("Could not parse jwt: %v", err)
    }

    var session Session
    claims, ok := token.Claims.(jwt.MapClaims);
    if !ok || !token.Valid {
        log.Fatalf("Could not parse jwt claims: ok=%v, valid=%v",ok, token.Valid)
    }
    properties, ok := claims["properties"].(map[string]interface{})
    if !ok {
        log.Fatalf("jwt claims did not contain properties: %v", claims)
    }
    switch claims["type"] {
    case "user":
        userId, ok := properties["userId"].(string)
        if !ok {
            log.Fatalf("jwt claims did not contain expected session info: %v", claims)
        }
        session = UserSession{UserId: userId}
    default:
        session = PublicSession{}
    }
    return session
}

func GetSessionFromHeaders(headers map[string]string) (Session, error) {
    var session Session = PublicSession{}
    header, ok := headers["authorization"]
    if !ok {
        return session, fmt.Errorf("Request did not contain Authorization header")
    }
    if len(header) < 7 {
        return session, fmt.Errorf("Authorization header was too short")
    }
    token := header[7:]
    // for some reason Replicache does not include the Bearer prefix
    if header[:7] != "Bearer " {
        token = header
    }
    return GetSession(token), nil
}
