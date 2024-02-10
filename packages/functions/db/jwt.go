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

func getPublicKey(token *jwt.Token) (any, error) {
    if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
        return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
    }
    publicKeyPem, err := GetJWTPublicKey()
    if (err != nil) {
        log.Fatalf("Could not get jwt public key: %v", err)
    }
    publicKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(publicKeyPem))
    return publicKey, err
}

func getSessionFromClaims(claims jwt.MapClaims) (Session, error) {
    sessionType, ok := claims["type"].(string)
    if !ok {
        return nil, fmt.Errorf("jwt claims did not contain session type: %v", claims)
    }

    properties, ok := claims["properties"].(map[string]any)
    if !ok {
        return nil, fmt.Errorf("jwt claims did not contain properties: %v", claims)
    }

    var session Session = PublicSession{}

    if sessionType == "user" {
        userId, ok := properties["userId"].(string)
        if !ok {
            err := fmt.Errorf("jwt claims did not contain userId for user session: %v", claims)
            return nil, err
        }
        session = UserSession{UserId: userId}
    }

    return session, nil
}

func GetSession(tokenString string) Session {
    token, err := jwt.Parse(tokenString, getPublicKey)
    if err != nil {
        log.Fatalf("Could not parse jwt: %v", err)
    }

    claims, ok := token.Claims.(jwt.MapClaims);
    if !ok || !token.Valid {
        log.Fatalf("Could not parse jwt claims: ok=%v, valid=%v",ok, token.Valid)
    }

    session, err := getSessionFromClaims(claims)
    if err != nil {
        log.Fatalf("Could not get session from claims: %v", err)
    }

    return session
}

func GetSessionFromHeaders(headers map[string]string) (Session, error) {
    var session Session = PublicSession{}
    header, ok := headers["authorization"]
    if !ok {
        return session, fmt.Errorf("request did not contain Authorization header")
    }
    if len(header) < 7 {
        return session, fmt.Errorf("authorization header was too short")
    }
    token := header[7:]
    // for some reason Replicache does not include the Bearer prefix
    if header[:7] != "Bearer " {
        token = header
    }
    return GetSession(token), nil
}
