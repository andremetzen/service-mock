# service-mock

This is a mock web service to test connection between services and fake load.

## Endpoints

### GET /
returns a HTTP 200 Ok

### GET /fail
returns a HTTP 500 Internal Server Error

### GET /success
returns a HTTP 200 Ok

### GET /health
returns the current health state of the service

### GET /health/disable
change the current health state to unhealthy

### GET /health/enable
change the current health state to healthy

### GET /health/timeout/:seconds
change the current health state to unhealthy for _:seconds_  seconds

### GET /highload/:seconds
stress the CPU for _:seconds_ seconds

### GET /request/:endpoint
do a GET request to _:endpoint_ and show the result

### GET /exit
ends the application
